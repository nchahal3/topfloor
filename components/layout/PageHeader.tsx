interface PageHeaderProps {
  label: string;
  title: string;
  subtitle?: string;
}

export default function PageHeader({ label, title, subtitle }: PageHeaderProps) {
  return (
    <div
      style={{
        padding: "72px 24px 56px",
        textAlign: "center",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
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
        style={{ color: "#f5f5f5", fontSize: "clamp(42px, 7vw, 72px)", margin: 0, lineHeight: 1 }}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          style={{
            color: "rgba(255,255,255,0.45)",
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
  );
}
