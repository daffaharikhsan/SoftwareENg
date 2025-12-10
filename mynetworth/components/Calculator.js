export default function Calculator({ a, b }) {
  if (b === 0) return <span>Error: Bagi 0</span>;
  return (
    <div>
      <h1>Hasil: {a + b}</h1>
      <p data-testid="pembagian">{a / b}</p>
    </div>
  );
}
