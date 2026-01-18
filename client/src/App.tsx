import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home'
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Events from './pages/Events';
import EventInfo from './pages/EventInfo'
import EditProfile from './pages/EditProfile';
import StudyGroups from './pages/GroupStudy'
import NavBar from './components/NavBar';
import FollowList from './pages/FollowList';

import { AuthProvider } from './context/AuthContext'; // global user data




function AppContent() {
  const location = useLocation();

    // pages that do not show the nav bar
    const hideNavBarPaths = ['/login', '/signup'];
    const shouldShowNavBar = !hideNavBarPaths.includes(location.pathname);
  

  return (
    <>
      {shouldShowNavBar && <NavBar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:eventId" element={<EventInfo />} />
        <Route path="/study-groups" element={<StudyGroups />} />
        <Route path="/profile/:username/connections" element={<FollowList />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}


export default App;