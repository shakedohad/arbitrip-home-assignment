/**
 * Renders a numeric rating as filled / empty star characters.
 */
export default function StarRating({
  rating,
  maxStars = 5,
  className = "",
  showValue = false,
}) {
  const fullStars = Math.floor(rating);
  const stars = "★".repeat(fullStars) + "☆".repeat(maxStars - fullStars);

  const rootClass = ["star-rating", className].filter(Boolean).join(" ");

  return (
    <span className={rootClass}>
      {stars}
      {showValue ? ` (${rating})` : null}
    </span>
  );
}
