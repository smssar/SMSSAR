/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { Readable } from "stream";
import { getLocaleFromHeaders, jsonError } from "@/lib/api-utils";

export const runtime = "nodejs";

async function getAuthorizedUser() {
  const session = await auth();
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
  console.log(
    "[AUTH] User found. DB Role:",
    dbUser.role,
    "Session Role:",
    sessionRole,
  );
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
  const locale = getLocaleFromHeaders(request.headers as Headers);
  const authorizedUser = await getAuthorizedUser();
  console.log(authorizedUser);
  if (!authorizedUser) {
    return jsonError({ key: "errors.uploadAuth", locale }, 403);
  }

  try {
    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError({ key: "errors.invalidJson", locale }, 400);
    }

    // server-side size limits (match client-side limits)
    const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
    const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB
    const mimeType = file.type || "";
    const isVideo = mimeType.startsWith("video/");

    if (
      (isVideo && file.size > MAX_VIDEO_BYTES) ||
      (!isVideo && file.size > MAX_IMAGE_BYTES)
    ) {
      const msg =
        locale === "ar"
          ? "حجم الملف كبير جدًا. يرجى رفع ملفات أصغر أو ضغط الملف ومحاولة مرة أخرى."
          : locale === "fr"
            ? "Le fichier est trop volumineux. Veuillez télécharger des fichiers plus petits ou compresser le fichier et réessayer."
            : "File is too large. Please upload smaller files or compress the file and try again.";

      return NextResponse.json(
        { error: msg, code: "FUNCTION_PAYLOAD_TOO_LARGE" },
        { status: 413 },
      );
    }

    const folder = `kirae/properties/${
      authorizedUser.email || authorizedUser.id
    }`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let uploadResult;

    if (isVideo) {
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
              // map large payload/cloudinary errors to 413 for client handling
              const message = (error as any)?.message ?? String(error);
              const isPayloadTooLarge =
                (error as any)?.http_code === 413 ||
                /payload|request body too large|413/i.test(message) ||
                (error as any)?.code === "FUNCTION_PAYLOAD_TOO_LARGE";

              if (isPayloadTooLarge) {
                reject(
                  Object.assign(new Error(message), {
                    code: "FUNCTION_PAYLOAD_TOO_LARGE",
                    status: 413,
                  }),
                );
                return;
              }

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
              const message = (error as any)?.message ?? String(error);
              const isPayloadTooLarge =
                (error as any)?.http_code === 413 ||
                /payload|request body too large|413/i.test(message) ||
                (error as any)?.code === "FUNCTION_PAYLOAD_TOO_LARGE";

              if (isPayloadTooLarge) {
                reject(
                  Object.assign(new Error(message), {
                    code: "FUNCTION_PAYLOAD_TOO_LARGE",
                    status: 413,
                  }),
                );
                return;
              }

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
    // If the error was a payload-too-large, return 413 with a clear code
    const errAny = error as any;
    if (
      errAny?.code === "FUNCTION_PAYLOAD_TOO_LARGE" ||
      errAny?.status === 413 ||
      /payload|request body too large|413/i.test(String(errAny?.message ?? ""))
    ) {
      const msg =
        locale === "ar"
          ? "حجم الملف كبير جدًا. يرجى رفع ملفات أصغر أو ضغط الملف ومحاولة مرة أخرى."
          : locale === "fr"
            ? "Le fichier est trop volumineux. Veuillez télécharger des fichiers plus petits ou compresser le fichier et réessayer."
            : "File is too large. Please upload smaller files or compress the file and try again.";

      return NextResponse.json(
        { error: msg, code: "FUNCTION_PAYLOAD_TOO_LARGE" },
        { status: 413 },
      );
    }

    return jsonError({ key: "errors.invalidJson", locale }, 500);
  }
}

export async function DELETE(request: Request) {
  const locale = getLocaleFromHeaders(request.headers as Headers);
  const authorizedUser = await getAuthorizedUser();

  if (!authorizedUser) {
    return jsonError({ key: "errors.deleteAuth", locale }, 403);
  }

  try {
    const body = (await request.json()) as {
      publicId?: string;
      resourceType?: "image" | "video" | "raw";
    };

    if (!body.publicId) {
      return jsonError({ key: "errors.invalidJson", locale }, 400);
    }

    const result = await cloudinary.uploader.destroy(body.publicId, {
      resource_type: body.resourceType ?? "image",
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Delete failed:", error);
    return jsonError({ key: "errors.invalidJson", locale }, 500);
  }
}
