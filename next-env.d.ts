/// <reference types="next" />
/// <reference types="next/image-types/global" />

declare module 'next/server' {
  export class NextResponse extends Response {
    static json(body: any, init?: ResponseInit): NextResponse;
    static redirect(url: string | URL, status?: number): NextResponse;
    static rewrite(url: string | URL): NextResponse;
    static next(): NextResponse;
  }
  export class NextRequest extends Request {
    nextUrl: URL;
    cookies: any;
  }
}

declare module 'next/server.js' {
  export * from 'next/server';
}

declare module 'next' {
  export type Metadata = any;
  export type ResolvingMetadata = any;
  export type ResolvingViewport = any;
}

declare module 'next/dist/lib/metadata/types/metadata-interface.js' {
  export type Metadata = any;
  export type ResolvingMetadata = any;
  export type ResolvingViewport = any;
}
