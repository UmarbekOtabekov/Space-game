
import { Route, Routes } from "react-router-dom";
import Home from "./pages/home/Home";
import SpaceGame from "./pages/game/Game";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="game" element={<SpaceGame />} />
    </Routes>
  );
}

export default App;