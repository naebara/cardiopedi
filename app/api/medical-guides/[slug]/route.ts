import { readFile, stat } from "fs/promises";
import { type NextRequest, NextResponse } from "next/server";
import { getMedicalGuideDocumentBySlug } from "@/lib/medical-guides";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { slug } = await params;
  const guide = await getMedicalGuideDocumentBySlug(slug);

  if (!guide) {
    return NextResponse.json({ message: "Ghidul nu a fost gasit." }, { status: 404 });
  }

  const fileStats = await stat(guide.absolutePath);
  const range = parseRangeHeader(request.headers.get("range"), fileStats.size);
  const headers = getPdfHeaders(guide.fileName, fileStats.size);
  const fileBuffer = await readFile(guide.absolutePath);

  if (request.headers.has("range")) {
    if (!range) {
      headers.set("Content-Range", `bytes */${fileStats.size}`);
      return new Response(null, { headers, status: 416 });
    }

    headers.set("Content-Length", String(range.end - range.start + 1));
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${fileStats.size}`);

    return new Response(fileBuffer.subarray(range.start, range.end + 1), {
      headers,
      status: 206,
    });
  }

  return new Response(fileBuffer, {
    headers,
    status: 200,
  });
}

function getPdfHeaders(fileName: string, fileSize: number) {
  return new Headers({
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
    "Content-Disposition": inlineContentDisposition(fileName),
    "Content-Length": String(fileSize),
    "Content-Type": "application/pdf",
    "Cross-Origin-Resource-Policy": "same-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow",
  });
}

function inlineContentDisposition(fileName: string) {
  const fallbackName = fileName.replace(/[^\x20-\x7e]/g, "").replace(/["\\]/g, "").trim() || "ghid-medical.pdf";

  return `inline; filename="${fallbackName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

function parseRangeHeader(rangeHeader: string | null, fileSize: number) {
  if (!rangeHeader) {
    return null;
  }

  const match = rangeHeader.match(/^bytes=(\d*)-(\d*)$/);

  if (!match) {
    return null;
  }

  const [, startValue, endValue] = match;
  let start = startValue ? Number(startValue) : null;
  let end = endValue ? Number(endValue) : null;

  if (start === null && end === null) {
    return null;
  }

  if (start === null) {
    if (!end || end < 1) {
      return null;
    }

    start = Math.max(fileSize - end, 0);
    end = fileSize - 1;
  } else if (end === null) {
    end = fileSize - 1;
  }

  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end >= fileSize || start > end) {
    return null;
  }

  return { end, start };
}
