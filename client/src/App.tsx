import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home'
import Login from './components/Login';
import Signup from './components/Signup';
import Profile from './components/Profile';
import Events from './components/Events';
import EventInfo from './components/EventInfo'
import EditProfile from './components/EditProfile';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:eventId" element={<EventInfo />} />
        <Route path="/profile/edit" element={<EditProfile />} />
      </Routes>
    </Router>
  );
}

export default App;