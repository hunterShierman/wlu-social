import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './components/Home'
import Login from './components/Login';
import Signup from './components/Signup';
import Profile from './components/Profile';
import Events from './components/Events';
import EventInfo from './components/EventInfo'
import EditProfile from './components/EditProfile';
import StudyGroups from './components/GroupStudy'
import NavBar from './components/NavBar';
import FollowList from './components/FollowList';



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
      <AppContent />
    </Router>
  );
}


export default App;