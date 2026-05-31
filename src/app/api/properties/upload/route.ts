/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { Readable } from "stream";

export const runtime = "nodejs";

async function getAuthorizedUser() {
  const session = await auth();
  console.log("[AUTH] Session user:", {
    id: session?.user?.id,
    email: session?.user?.email,
    role: session?.user?.role,
  });

  const userId = session?.user?.id;
  const userEmail = session?.user?.email?.trim().toLowerCase();

  if (!userId && !userEmail) {
    console.log("[AUTH] No userId or userEmail in session, denying access");
    return null;
  }

  const dbUser = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
        },
      })
    : await prisma.user.findUnique({
        where: { email: userEmail ?? "" },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

  if (!dbUser) {
    console.log("[AUTH] User not found in database, denying access");
    return null;
  }

  const sessionRole = session?.user?.role;

  const isAuthorized =
    dbUser.role === "ADMIN" ||
    dbUser.role === "SELLER" ||
    sessionRole === "ADMIN" ||
    sessionRole === "SELLER";

  if (!isAuthorized) {
    console.log(
      "[AUTH] User not authorized (not ADMIN or SELLER)",
      dbUser.role,
      sessionRole,
    );
    return null;
  }

  console.log("[AUTH] Authorization granted for user:", dbUser.id);
  return dbUser;
}

export async function POST(request: Request) {
  const authorizedUser = await getAuthorizedUser();

  if (!authorizedUser) {
    return NextResponse.json(
      { error: "Only admins and sellers can upload files." },
      { status: 403 },
    );
  }

  try {
    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const folder = `kirae/properties/${
      authorizedUser.email || authorizedUser.id
    }`;

    const mimeType = file.type || "";
    console.log(mimeType);
    const isVideo = mimeType.startsWith("video/");

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let uploadResult;

    if (isVideo) {
      console.log("Uploading video file to Cloudinary:");
      uploadResult = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "video",
            folder,
            overwrite: false,
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary video upload error:", error);
              reject(error);
              return;
            }

            resolve(result);
          },
        );

        Readable.from(buffer).pipe(stream);
      });
    } else {
      uploadResult = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "auto",
            folder,
            overwrite: false,
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              reject(error);
              return;
            }

            resolve(result);
          },
        );

        Readable.from(buffer).pipe(stream);
      });
    }

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      resourceType: uploadResult.resource_type,
      bytes: uploadResult.bytes,
      format: uploadResult.format,
      duration: uploadResult.duration ?? null,
    });
  } catch (error) {
    console.error("Upload failed:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const authorizedUser = await getAuthorizedUser();

  if (!authorizedUser) {
    return NextResponse.json(
      { error: "Only admins and sellers can delete files." },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as {
      publicId?: string;
      resourceType?: "image" | "video" | "raw";
    };

    if (!body.publicId) {
      return NextResponse.json(
        { error: "publicId is required." },
        { status: 400 },
      );
    }

    const result = await cloudinary.uploader.destroy(body.publicId, {
      resource_type: body.resourceType ?? "image",
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Delete failed:", error);

    return NextResponse.json(
      { error: "Cloudinary delete failed." },
      { status: 500 },
    );
  }
}
