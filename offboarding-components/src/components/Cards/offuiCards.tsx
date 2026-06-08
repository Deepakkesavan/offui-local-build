import './offuiCards.css';

interface OffuiCardProps {
  title: string;
  value: string;
  subtitle: string;
}

const offuiCards = ({
  title,
  value,
  subtitle,
}: OffuiCardProps) => {
  return (
    <div className="offui-card-component">
      <p className="offui-card-title">{title}</p>

      <h2 className="offui-card-value">{value}</h2>

      <p className="offui-card-subtitle">{subtitle}</p>
    </div>
  );
};

export default offuiCards;