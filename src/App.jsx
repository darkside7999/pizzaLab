import './App.css'
import { Routes, Route } from 'react-router'
import VerPedidos from './components/VerPedidos'
import AddNumber from './components/AddNumber'
import NavBar from './components/NavBar'

function App() {
  return (
    <>
      <div>
        <NavBar />
        <Routes>
          <Route path='/' element={<VerPedidos />} />
          <Route path='/numero' element={<AddNumber />} />
        </Routes>
      </div>
    </>
  )
}

export default App