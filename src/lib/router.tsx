import { useEffect, useState, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from "react";

/** Минимальный hash-роутер: работает без сервера, даже при открытии index.html из файла. */

const normalize = (h: string) => {
  const p = h.replace(/^#/, "") || "/";
  return p.startsWith("/") ? p : `/${p}`;
};

export function usePathname(): string {
  const [path, setPath] = useState(() => normalize(window.location.hash));
  useEffect(() => {
    const on = () => setPath(normalize(window.location.hash));
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return path;
}

export function navigate(to: string) {
  if (normalize(window.location.hash) !== to) window.location.hash = to;
}

export function useRouter() {
  return {
    push: (to: string) => navigate(to),
    refresh: () => {},
  };
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string; children?: ReactNode };

export function Link({ href, onClick, children, ...rest }: LinkProps) {
  return (
    <a
      href={`#${href}`}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
