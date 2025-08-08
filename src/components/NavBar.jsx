import { NavLink } from 'react-router'
import './NavBar.css'

export default function NavBar() {
    return(
        <>
            <nav>
                <NavLink to={'/'} end>
                    Home
                </NavLink>
                <NavLink to={'/numero'} end>
                    Numero
                </NavLink>
            </nav>
        </>
    )
}