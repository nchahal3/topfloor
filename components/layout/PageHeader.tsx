import Image from "next/image";

interface PageHeaderProps {
  label: string;
  title: string;
  subtitle?: string;
  /** Optional background image (home-page neon style). Adds a dark scrim. */
  image?: string;
}

export default function PageHeader({
  label,
  title,
  subtitle,
  image,
}: PageHeaderProps) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        padding: image ? "120px 24px 96px" : "72px 24px 56px",
        textAlign: "center",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {image && (
        <>
          <Image
            src={image}
            alt=""
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
          {/* scrim so the centered text stays readable */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(10,10,10,0.55), rgba(10,10,10,0.5))",
            }}
          />
        </>
      )}

      <div style={{ position: "relative", zIndex: 1 }}>
        <p
          style={{
            color: "#00ff88",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            margin: "0 0 16px",
          }}
        >
          {label}
        </p>
        <h1
          className="display-font"
          style={{
            color: "#f5f5f5",
            fontSize: "clamp(42px, 7vw, 72px)",
            margin: 0,
            lineHeight: 1,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: 16,
              maxWidth: 560,
              margin: "16px auto 0",
              lineHeight: 1.7,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
