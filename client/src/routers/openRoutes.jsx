import Error from "../Error";
import { OpenLayout } from "../layout/OpenLayout";
import { Landing } from "../pages/Landing";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import InviteAuction from "../pages/InviteAuction";
import { Contact } from "../pages/Contact";
import { About } from "../pages/About";
import Legal from "../pages/Legal/Legal";
export const openRoutes=[
{
	path:"/",element:<OpenLayout/>,errorElement:<Error/>,
	children:[
	{index:true,element:<Landing/>},
	{path:"login",element:<Login/>},
	{path:"signup",element:<Signup/>},
	{path:"invite/:guid",element:<InviteAuction/>},
	{path: "about", element: <About /> },
	{path: "legal", element: <Legal /> },
	{path: "contact", element: <Contact /> },
	],},];
