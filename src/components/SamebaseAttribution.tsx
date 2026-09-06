export function SamebaseAttribution() {
  return (
    <a
      href="https://samebase.com"
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex min-h-11 items-center text-xs focus-visible:outline-current"
    >
      <span className="flex items-center gap-1 border-b border-transparent group-hover:border-current">
        Managed with{" "}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 60 60"
          width={15}
          height={15}
          shapeRendering="crispEdges"
          className="dark:invert"
          aria-hidden="true"
        >
          <rect width="60" height="60" fill="#ffffff" />
          <path d="M6 6h48v48H6z M22 22h16v16H22z" fill="#394447" fillRule="evenodd" />
        </svg>
        <b>Samebase</b>
      </span>
    </a>
  );
}
