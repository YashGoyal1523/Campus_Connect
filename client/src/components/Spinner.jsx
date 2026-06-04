// Spinner — full-section loading indicator shown while async data is being fetched.
// Uses a CSS border trick: all borders are purple except the top one (transparent),
// which creates the spinning arc effect via Tailwind's animate-spin (CSS animation).
const Spinner = () => {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default Spinner;
