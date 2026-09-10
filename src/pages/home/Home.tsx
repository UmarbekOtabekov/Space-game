import { NavLink } from "react-router-dom"

function Home() {
    return (
        <>
            <div className="stars" ></div>
            <div className="menu-container">
                <h1 className="game-title">SPACE SHOOTER</h1>
                <p className="subtitle">ARCADE EDITION</p>
                <div className="buttons-group">
                    <NavLink to={"/game"} className="btn btn-primary">O'YINNI BOSHLASH</NavLink>
                </div>
                <div className="instructions">
                    <p>Boshqarish: <span>W, A, S, D</span> yoki <span>Strelkalar</span> | Otish: <span>SPACE</span></p>
                </div>
            </div>
        </>
    )
}
export default Home