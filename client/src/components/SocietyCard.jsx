// SocietyCard is a reusable card that displays summary info about one society.
// Props:
//   - society: the society data object (logo, name, category, description, college, _id)
//   - onClick: opens the society detail modal when the card is clicked
//   - isFollowing: boolean — whether the logged-in student already follows this society
//   - onToggleFollow: optional; when provided a Follow/Unfollow button is rendered inside the card
const SocietyCard = ({ society, onClick, isFollowing, onToggleFollow }) => {
  return (
    // flex flex-col lets the card grow vertically and keeps the footer (follow button) pinned to the bottom
    <div
      onClick={onClick}
      className="cursor-pointer rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition overflow-hidden group flex flex-col"
    >
      {/* Fixed-height banner area at the top of the card.
          If the society has a logo we show it; otherwise we fall back to
          a large initial letter inside a circle — a common avatar fallback pattern */}
      <div className="h-32 bg-linear-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center shrink-0">
        {society.logo
          ? <img src={society.logo} alt={society.name} className="w-20 h-20 object-contain rounded-full" />
          : (
            // Avatar fallback: show the first uppercase letter of the society name
            // charAt(0).toUpperCase() safely handles any casing in the stored name
            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-white/20 flex items-center justify-center shadow-md">
              <span className="text-2xl font-bold text-white/70">{society.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
      </div>

      {/* flex-1 on this container makes it grow to fill remaining card height,
          so the follow button always aligns at the bottom regardless of description length */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          {/* truncate prevents a very long society name from overflowing into the category badge */}
          <h3 className="font-bold text-lg truncate mr-2">{society.name}</h3>
          {/* shrink-0 prevents the category badge from being compressed by the truncated name */}
          <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">{society.category}</span>
        </div>

        {/* flex-1 pushes the follow button to the card bottom when description is short */}
        <div className="flex-1">
          {/* line-clamp-2 limits the description to 2 lines so all cards stay the same height in the grid */}
          <p className="text-white/50 text-sm line-clamp-2">{society.description}</p>
          <p className="text-white/30 text-xs mt-3">🏫 {society.college}</p>
        </div>

        {/* Only render the Follow button if an onToggleFollow handler was passed in.
            On the Discover page it is provided; in other read-only contexts it is omitted */}
        {onToggleFollow && (
          <button
            // stopPropagation prevents the card's onClick (openSociety) from firing
            // when the user clicks Follow — we only want to toggle follow, not also open the modal
            onClick={(e) => { e.stopPropagation(); onToggleFollow(society._id); }}
            // Button styling changes dynamically depending on follow state:
            //   - Following: muted style that turns red on hover (signals "click to unfollow")
            //   - Not following: purple accent that invites the user to follow
            className={`mt-4 w-full py-2 rounded-xl text-xs font-semibold transition border
              ${isFollowing
                ? "bg-white/5 border-white/20 text-white/60 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                : "bg-purple-500/20 border-purple-500/40 text-purple-300 hover:bg-purple-500/30"}`}
          >
            {isFollowing ? "Following" : "+ Follow"}
          </button>
        )}
      </div>
    </div>
  );
}

export default SocietyCard;
