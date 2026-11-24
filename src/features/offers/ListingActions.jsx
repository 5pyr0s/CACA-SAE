import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { OFFER_STATUS } from "../../lib/trading";
import { subscribeMyOffersOnListing } from "../../services/offers";
import { subscribeListingReservation } from "../../services/reservations";
import AuctionPanel from "../auctions/AuctionPanel";
import OfferDialog from "./OfferDialog";
import ReserveButton from "./ReserveButton";

// Fills A's "student-b-action-slot" on the listing page.
export default function ListingActions({ listing }) {
  if (listing.type === "auction") return <AuctionPanel listing={listing} />;
  return <OfferActions listing={listing} />;
}

function OfferActions({ listing }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [myOffers, setMyOffers] = useState([]);
  const [reservation, setReservation] = useState(null);

  const uid = user?.uid;
  useEffect(() => (uid ? subscribeMyOffersOnListing(listing.id, uid, setMyOffers) : undefined), [listing.id, uid]);
  useEffect(() => subscribeListingReservation(listing.id, setReservation), [listing.id]);

  const pending = myOffers.find((o) => o.status === OFFER_STATUS.PENDING);
  const reservedByOther = reservation && reservation.buyerId !== uid;
  const available = listing.status === "active";

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-semibold uppercase text-slate-500">
          {listing.type === "swap" ? "Swap or buy" : "Fixed price"}
        </div>
        <div className="text-2xl font-bold">{listing.price} RON</div>
        {reservation && (
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">Reserved</span>
        )}
      </div>

      {!available ? (
        <p className="text-sm text-slate-600">This listing is no longer available.</p>
      ) : !user ? (
        <Link
          to="/login"
          state={{ from: { pathname: `/listings/${listing.id}` } }}
          className="block w-full text-center py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
        >
          Sign in to make an offer
        </Link>
      ) : user.uid === listing.sellerId ? (
        <Link to="/offers" className="block w-full text-center py-2.5 rounded-lg bg-slate-100 text-slate-800 text-sm font-semibold hover:bg-slate-200">
          See offers on your listing
        </Link>
      ) : (
        <>
          {pending ? (
            <div className="px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-sm text-indigo-900">
              Your offer ({pending.kind === "price" ? `${pending.amount} RON` : `swap: ${pending.swapListingTitle}`}) is waiting
              for the seller.{" "}
              <Link to="/offers" className="font-semibold underline">
                My offers
              </Link>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setOpen(true)}
              disabled={reservedByOther}
              className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {reservedByOther ? "Reserved by someone else" : "Make offer"}
            </button>
          )}
          {listing.type === "fixed" && <ReserveButton listing={listing} />}
        </>
      )}

      {open && <OfferDialog listing={listing} onClose={() => setOpen(false)} />}
    </div>
  );
}
