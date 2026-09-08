export function Placeholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <>
      <p className="eyebrow">WORKSPACE</p>
      <h1>{title}</h1>
      <section className="panel">
        <h2>ยังไม่เปิดใช้งาน</h2>
        <p className="muted">{description}</p>
      </section>
    </>
  );
}
