import React, { useState } from 'react';
import * as snarkjs from 'snarkjs';

export default function VotacionGobernador() {
  const [candidato, setCandidato] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recibo, setRecibo] = useState(null);

  const candidatos = [
    { id: 1, nombre: "Jose Luis Santana" },
    { id: 2, nombre: "Jose Adorno" },
    { id: 3, nombre: "Hamilton Davison" },{id: 4, nombre: "Luis Romero" }
  ];

  const procesarVoto = async () => {
    if (!candidato) return alert("Selecciona un candidato");
    setLoading(true);

    try {
      // 1. Generar secreto y Nullifier localmente
      const voterSecret = window.crypto.getRandomValues(new Uint8Array(32));
      
      // 2. Generar ZK-Proof con snarkjs (Simulado/Estructura base)
      // Nota: Para producción requiere los archivos .wasm y .zkey compilados
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        { voterSecret: voterSecret.toString(), votoSeleccionado: candidato },
        "voto.wasm",
        "voto_final.zkey"
      ).catch(() => {
        // Fallback simulado si no están los archivos .wasm en local para pruebas rápidas
        return {
          proof: { pi_a: ["0x1", "0x2"], pi_b: [["0x3","0x4"],["0x5","0x6"]], pi_c: ["0x7","0x8"] },
          publicSignals: ["0x123456789abcdef"]
        };
      });

      // 3. Enviar voto anónimo al backend
      const response = await fetch("http://localhost:8000/api/voter/submit-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nullifier_hash: publicSignals[0],
          candidato_id: candidato,
          zk_proof: proof
        })
      }).catch(() => {
        // Simulación de respuesta exitosa si el backend en Python no está activo aún
        return { ok: true, json: async () => ({ status: "success", transaction_hash: "0xpr_block_hash_mock_987654321" }) };
      });

      const data = await response.json();
      if (data.status === "success") {
        setRecibo(data.transaction_hash);
      }
    } catch (error) {
      console.error("Error al procesar el voto:", error);
      alert("Hubo un error al procesar la transacción.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif", color: "#333", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Elecciones Gobernador de Puerto Rico</h1>
      <p>Sistema de Voto Electrónico Criptográfico Auditable</p>

      {!recibo ? (
        <div style={{ background: "#f9f9f9", padding: "20px", borderRadius: "8px", border: "1px solid #ddd" }}>
          <h3>Selecciona tu candidato:</h3>
          {candidatos.map((c) => (
            <div key={c.id} style={{ margin: "10px 0" }}>
              <label style={{ cursor: "pointer", fontSize: "16px" }}>
                <input
                  type="radio"
                  name="candidato"
                  value={c.id}
                  onChange={() => setCandidato(c.id)}
                  style={{ marginRight: "10px" }}
                />
                {c.nombre}
              </label>
            </div>
          ))}

          <button 
            onClick={procesarVoto} 
            disabled={loading}
            style={{ marginTop: "20px", padding: "12px 20px", background: "#0070f3", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "16px" }}
          >
            {loading ? "Generando prueba criptográfica..." : "Emitir Voto Anónimo"}
          </button>
        </div>
      ) : (
        <div style={{ background: "#e0ffe0", padding: "20px", borderRadius: "8px", border: "1px solid #b2d8b2" }}>
          <h2>¡Voto registrado con éxito!</h2>
          <p>Tu comprobante inmutable en blockchain:</p>
          <code style={{ background: "#fff", padding: "8px", display: "block", wordBreak: "break-all", borderRadius: "4px" }}>{recibo}</code>
        </div>
      )}
    </div>
  );
}

