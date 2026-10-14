export default function LabPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <a
          href="/afiliados-web/"
          className="text-cyan-400 hover:underline"
        >
          ← Volver a la página principal
        </a>

        <header className="py-10">
          <p className="text-cyan-400 font-mono">
            NETWORK ENGINEERING / CONTAINERLAB
          </p>

          <h1 className="text-4xl font-bold mt-3">
            Mi laboratorio BGP
          </h1>

          <p className="mt-4 text-slate-300">
            Laboratorio de enrutamiento con FRRouting,
            Docker y Containerlab.
          </p>

          <span className="inline-block mt-5 rounded-full bg-emerald-900
            px-4 py-2 text-emerald-300">
            ✓ Sesión BGP establecida en la última comprobación
          </span>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          <article className="rounded-xl border border-slate-700 p-6">
            <p className="text-slate-400">Router 1</p>
            <h2 className="text-2xl font-bold mt-2">R1</h2>
            <p className="mt-2">AS 65001</p>
            <p className="text-sm text-slate-400 mt-2">
              Router ID: 1.1.1.1
            </p>
          </article>

          <article className="rounded-xl border border-cyan-700 p-6">
            <p className="text-slate-400">Enlace entre routers</p>
            <h2 className="text-xl font-bold mt-2">
              R1 ↔ R2
            </h2>
            <p className="mt-2 font-mono text-cyan-300">
              10.10.0.0/30
            </p>
            <p className="text-sm text-slate-400 mt-2">
              Vecinos eBGP · IPv4
            </p>
          </article>

          <article className="rounded-xl border border-slate-700 p-6">
            <p className="text-slate-400">Router 2</p>
            <h2 className="text-2xl font-bold mt-2">R2</h2>
            <p className="mt-2">AS 65002</p>
            <p className="text-sm text-slate-400 mt-2">
              Router ID: 2.2.2.2
            </p>
          </article>
        </section>

        <section className="mt-10 rounded-xl border border-slate-700 p-6">
          <h2 className="text-2xl font-bold">
            Rutas BGP verificadas
          </h2>

          <p className="mt-3 text-slate-300">
            R1 aprende la ruta de R2 y R2 aprende la ruta de R1.
          </p>

          <div className="overflow-x-auto mt-5">
            <table className="w-full text-left">
              <thead className="text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-3 pr-4">Router</th>
                  <th className="py-3 pr-4">Prefijo</th>
                  <th className="py-3">Siguiente salto</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-800">
                  <td className="py-3 pr-4">R1</td>
                  <td className="py-3 pr-4 font-mono">192.0.2.0/24</td>
                  <td className="py-3">Local</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="py-3 pr-4">R1</td>
                  <td className="py-3 pr-4 font-mono">198.51.100.0/24</td>
                  <td className="py-3 font-mono">10.10.0.2</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="py-3 pr-4">R2</td>
                  <td className="py-3 pr-4 font-mono">192.0.2.0/24</td>
                  <td className="py-3 font-mono">10.10.0.1</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">R2</td>
                  <td className="py-3 pr-4 font-mono">198.51.100.0/24</td>
                  <td className="py-3">Local</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 rounded-xl bg-slate-900 p-6">
          <h2 className="text-xl font-bold">
            Tecnologías utilizadas
          </h2>
          <p className="mt-3 text-slate-300">
            Ubuntu · Docker · Containerlab · FRRouting · BGP · IPv4
          </p>
        </section>

        <footer className="mt-10 border-t border-slate-800 pt-5
          text-sm text-slate-400">
          Laboratorio educativo. Los prefijos mostrados están
          reservados para documentación y pruebas.
        </footer>
      </div>
    </main>
  );
}
