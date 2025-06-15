import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar'
import Home from "./pages/Home";
import GMB from './pages/GMB';
import PagesJaune from './pages/PageJaune';
import './index.css'

function App() {
  

  return (
   <BrowserRouter>
   <div className='flex'>
    <Navbar/>
    <main className='ml-64 flex-1 min-h-screen'>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/gmb' element={<GMB />} />
        <Route path='/page-jaunes' element={<PagesJaune />} />
      </Routes>
    </main>
   </div>
   </BrowserRouter>

  )
}

export default App;
