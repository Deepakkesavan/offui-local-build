import './offuiIESubmitCard.css';

interface SubmitCardProps {
  date: string;   // e.g. "2026-06-10"
  time: string;   // e.g. "09:45:30"
}

const offuiIESubmitCard = ({ date, time }: SubmitCardProps) => {
  return (
    <div className="offui-submit-card">

      {/* Green check icon */}
      <div className="offui-submit-card-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h2 className="offui-submit-card-title">
        Resignation Submitted Successfully
      </h2>

      <p className="offui-submit-card-message">
        Your resignation has been recorded and is now pending manager review.
      </p>

      <span className="offui-submit-card-timestamp">
        📅 {date} &nbsp;|&nbsp; 🕐 {time}
      </span>

    </div>
  );
};

export default offuiIESubmitCard;