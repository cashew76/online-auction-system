import Error from "../Error";
import { MainLayout } from "../layout/MainLayout";
import { MyAuction } from "../pages/MyAuction";
import { CreateAuction } from "../pages/CreateAuction";
import ManageAuction from "../pages/ManageAuction";
import Profile from "../pages/Profile";
export const protectedRoutes=[{path:"/",element:<MainLayout/>,errorElement:<Error/>,children:[{path:"myauction",element:<MyAuction/>},{path:"auctions/create",element:<CreateAuction/>},{path:"auctions/:auctionId/manage",element:<ManageAuction/>},{path:"profile",element:<Profile/>}]}];
