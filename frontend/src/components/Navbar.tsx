import React from "react";
import NavCard from "./Navcard"


const Navbar: React.FC = () => {
    return (
        <aside className="fixed top-0 left-0 h-screen w-64 bg-neutral-100 border-r p-6 rounded-r-xl">
            <h1 className="text-2xl font-bold mb-8 text-neutral-600 text-center">Dashboard</h1>
            <ul className="space-y-4">
                <li><NavCard icon="🏠" label="Accueil" href="/" /></li>
                <li><NavCard icon="📈" label="GMB" href="/GMB" /></li>
                <li><NavCard icon="🟨" label="PageJaune" href="/page-jaunes" /></li>
            </ul>
        </aside>
    );
}

export default Navbar;