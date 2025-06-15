import React from "react";

const Home: React.FC = () => {
  return (
    <div className="space-y-10 py-12 pl-6 pr-6">
      <h1 className="text-4xl font-bold text-gray-900 text-center">
        👋 Bienvenue sur notre scrappeur
      </h1>

      <p className="text-lg text-gray-700 text-center">
        Cette interface vous permet de scraper des données et d’accéder aux fonctionnalités suivantes :
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <section className="p-6 bg-gray-100 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-2">📈 Google My Business</h2>
          <p className="text-gray-600">
            Générez une liste de clients potentiels via les fiches d’établissement Google.
          </p>
        </section>

        <section className="p-6 bg-gray-100 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-2">🟨 PagesJaunes</h2>
          <p className="text-gray-600">
            Générez une liste de clients potentiels via l’annuaire PagesJaunes.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Home;
