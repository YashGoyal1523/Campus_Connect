export default function SocietyCard({ society, onClick, isFollowing, onToggleFollow }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition overflow-hidden group flex flex-col"
    >
      <div className="h-32 bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center shrink-0">
        {society.logo
          ? <img src={society.logo} alt={society.name} className="w-20 h-20 object-contain rounded-full" />
          : (
            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-white/20 flex items-center justify-center shadow-md">
              <span className="text-2xl font-bold text-white/70">{society.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg truncate mr-2">{society.name}</h3>
          <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">{society.category}</span>
        </div>
        <div className="flex-1">
          <p className="text-white/50 text-sm line-clamp-2">{society.description}</p>
          <p className="text-white/30 text-xs mt-3">🏫 {society.college}</p>
        </div>

        {onToggleFollow && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFollow(society._id); }}
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
