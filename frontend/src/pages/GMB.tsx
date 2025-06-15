import React, { useState, useEffect } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const RESULTS_PER_PAGE = 10;

const GMB: React.FC = () => {
  const [cities, setCities] = useState("");
  const [sectors, setSectors] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(results.length / RESULTS_PER_PAGE);
  const paginatedResults = results.slice(
    (currentPage - 1) * RESULTS_PER_PAGE,
    currentPage * RESULTS_PER_PAGE
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Résultats");

    sheet.columns = [
      { header: "Nom", key: "name", width: 30 },
      { header: "Téléphone", key: "phone", width: 20 },
      { header: "Email", key: "email", width: 25 },
      { header: "Adresse", key: "address", width: 40 },
      { header: "Site Web", key: "website", width: 30 },
      { header: "Services", key: "services", width: 40 },
      { header: "Ville", key: "ville", width: 20 },
      { header: "Secteur", key: "secteur", width: 25 },
    ];

    results.forEach((item) => {
      sheet.addRow({
        name: item.name,
        phone: item.phone || "",
        email: item.email || "",
        address: item.address || "",
        website: item.website || "",
        services: item.services?.join(", ") || "",
        ville: item.ville || "",
        secteur: item.secteur || ""
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, "resultats_scraping.xlsx");
  };

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    setCurrentPage(1);

    try {
      const response = await fetch("http://localhost:4000/api/gmb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          villes: cities.split(",").map((c) => c.trim()),
          secteurs: sectors.split(",").map((s) => s.trim()),
        }),
      });
      if (!response.ok) throw new Error("Erreur lors de la recherche");

      const data = await response.json();
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCities("");
    setSectors("");
    setResults([]);
    setError("");
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">📈 Google My Business</h1>
        <p className="text-lg text-gray-700 mt-2">
          Interface de scraping pour les fiches Google.
        </p>
      </div>

      <div className="bg-rose-50 border border-rose-200 p-4 rounded-lg text-sm text-rose-800">
        <p>
          Entrez une ou plusieurs <strong>villes</strong> et <strong>secteurs d'activité</strong> pour effectuer une recherche groupée.
          <br />
          Par exemple : <em>“Paris, Lyon”</em> et <em>“Plombier, Électricien”</em>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-100 p-6 rounded-xl shadow-black space-y-2">
          <label htmlFor="cities" className="block text-sm font-medium text-gray-700">
            Ville(s)
          </label>
          <input
            id="cities"
            name="cities"
            type="text"
            value={cities}
            onChange={(e) => setCities(e.target.value)}
            placeholder="Ex : Paris"
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>

        <div className="bg-gray-100 p-6 rounded-xl shadow-black space-y-2">
          <label htmlFor="sector" className="block text-sm font-medium text-gray-700">
            Secteur d'activité
          </label>
          <input
            id="sector"
            name="sector"
            type="text"
            value={sectors}
            onChange={(e) => setSectors(e.target.value)}
            placeholder="Ex : Plombier"
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>
      </div>

      <div className="text-center flex justify-center gap-4">
        <button
          onClick={handleSearch}
          className="bg-neutral-600 text-white px-6 py-2 rounded-lg shadow hover:bg-neutral-400"
        >
          {loading ? "Recherche..." : "Rechercher"}
        </button>

        {!loading && results.length > 0 && (
          <>
            <button
              onClick={handleExport}
              className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
            >
              Exporter en Excel
            </button>
            <button
              onClick={handleClear}
              className="bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600"
            >
              Réinitialiser
            </button>
          </>
        )}
      </div>

      {error && <div className="text-red-600 font-medium text-center">❌ {error}</div>}

      {!loading && results.length > 0 && (
        <div className="text-sm text-gray-600 text-center">Résultats : {results.length}</div>
      )}

      {loading && (
        <div className="text-center text-rose-600 font-semibold animate-pulse">
          ⏳ Recherche en cours, merci de patienter...
        </div>
      )}

      <ul className="space-y-4 mt-8">
        {paginatedResults.map((item, index) => (
          <li key={index} className="p-4 bg-gray-100 rounded-xl shadow">
            <h2 className="text-lg font-semibold">{item.name}</h2>
            {item.address && <p>📍 {item.address}</p>}
            {item.phone && <p>📞 {item.phone}</p>}
            {item.email && <p>✉️ {item.email}</p>}
            {item.website && (
              <p>
                🌐 <a href={item.website} className="text-rose-600 underline" target="_blank" rel="noreferrer">{item.website}</a>
              </p>
            )}
            {item.services && item.services.length > 0 && (
              <p>🧰 Services : {item.services.join(", ")}</p>
            )}
            {item.ville && <p>🏙️ Ville : {item.ville}</p>}
            {item.secteur && <p>🔧 Secteur : {item.secteur}</p>}
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              className={`px-3 py-1 rounded-full text-sm font-medium ${currentPage === i + 1 ? "bg-rose-600 text-white" : "bg-gray-200"}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GMB;
