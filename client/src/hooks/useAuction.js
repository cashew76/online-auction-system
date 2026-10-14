import { useMutation,useQuery,useQueryClient } from "@tanstack/react-query";
import * as svc from "../services/auction.service.js";
export const useGetMyAuctions=()=>useQuery({queryKey:["ownerAuctions"],queryFn:svc.getMyAuctions});
export const useOwnerAuction=id=>useQuery({queryKey:["ownerAuction",id],queryFn:()=>svc.getOwnerAuction(id),enabled:!!id});
export const useCreateAuction=(options={})=>{const q=useQueryClient();return useMutation({mutationFn:svc.createAuction,onSuccess:(...a)=>{q.invalidateQueries({queryKey:["ownerAuctions"]});options.onSuccess?.(...a);},onError:options.onError});};
export const useInviteAuction=guid=>useQuery({queryKey:["inviteAuction",guid],queryFn:()=>svc.getInviteAuction(guid),enabled:!!guid,refetchInterval:15000});
export const useInviteBid=guid=>{const q=useQueryClient();return useMutation({mutationFn:({itemId,bidAmount})=>svc.placeInviteBid({guid,itemId,bidAmount}),onSuccess:()=>q.invalidateQueries({queryKey:["inviteAuction",guid]})});};
export const usePrefetchHandlers = () => {
  const queryClient = useQueryClient();

  const prefetchAuction = () => {};
  const prefetchAuctions = () => {};

  const prefetchMyAuctions = () => {
    queryClient.prefetchQuery({
      queryKey: ["ownerAuctions"],
      queryFn: svc.getMyAuctions,
      staleTime: 30_000,
    });
  };

  const prefetchMyBids = () => {};

  const prefetchDashboard = () => {};

  return {
    prefetchAuction,
    prefetchAuctions,
    prefetchMyAuctions,
    prefetchMyBids,
    prefetchDashboard,
  };
};
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const data = await svc.getMyAuctions();
      const auctions = data?.auctions || [];

      const now = new Date();

		return {
		  totalAuctions: auctions.length,
		  userAuctionCount: auctions.length,
		  activeAuctions: auctions.filter(
			(auction) =>
			  new Date(auction.startDate) <= now &&
			  new Date(auction.endDate) > now
		  ).length,
		  userCredit: 0,
		  latestAuctions: auctions.slice(0, 4),
		  latestUserAuctions: auctions.slice(0, 4),
		};
    },
  });
};