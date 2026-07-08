"use client";

import React from "react";
import Image from "next/image";

type Property = any;

export default function PropertyDialog({
  property,
  open,
  onClose,
}: {
  property: Property | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!open || !property) return null;

  const images = (property.media || []).filter((m: any) => m.type === "image");
  const mainImage = images[0]?.url;

  return (
    <div
      aria-modal
      role="dialog"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative z-10 max-w-4xl w-full mx-4 sm:mx-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-start justify-between p-4 border-b">
            <div>
              <h3 className="text-lg font-semibold">{property.title}</h3>
              <p className="text-sm text-gray-500">{property.city}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800"
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              {mainImage ? (
                <div className="w-full h-64 relative rounded-lg overflow-hidden">
                  <Image
                    src={mainImage}
                    alt={property.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                  No image
                </div>
              )}

              {images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {images.map((m: any) => (
                    <div
                      key={m.id}
                      className="w-20 h-14 relative rounded overflow-hidden"
                    >
                      <Image
                        src={m.url}
                        alt={property.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-1">
              <div className="space-y-3">
                <div className="text-blue-600 font-semibold text-xl">
                  {Number(property.price).toLocaleString()} {"MAD"}
                </div>
                <div className="text-sm text-gray-600">
                  {property.rooms} rooms • {property.bathrooms ?? 0} baths
                </div>

                <p className="text-sm text-gray-700">{property.description}</p>

                <div className="pt-4">
                  <a
                    href={`/${property.id}`}
                    className="block w-full text-center bg-black text-white py-2 rounded-lg hover:bg-gray-800"
                  >
                    View Full Listing
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
