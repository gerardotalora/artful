import ArtHome from './ArtHome.jsx';
import ArtInfo from './ArtInfo.jsx';
import ArtEdit from './ArtEdit.jsx';
import About from './About.jsx';
import Profile from './Profile.jsx';
import NotFound from './NotFound.jsx';

const routes = [
  { path: '/art', component: ArtHome },
  { path: '/edit/:id', component: ArtEdit },
  { path: '/info/:id?', component: ArtInfo },
  { path: '/about', component: About },
  { path: '/profile', component: Profile },
  { path: '*', component: NotFound },
];

export default routes;
