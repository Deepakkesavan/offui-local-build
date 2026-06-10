import './processTimeline.css';
import defaultData, { type TimelineItem } from './processTimelineData';

interface ProcessTimelineProps {
  items?: TimelineItem[];
}

const ProcessTimeline = ({ items = defaultData }: ProcessTimelineProps) => {
  return (
    <div className="offui-prc-wrapper">
      <h2 className="offui-prc-heading">Process Timeline</h2>

      {items.map((item, index) => (
        <div
          key={index}
          className={`offui-prc-timeline-item offui-prc-${item.status}`}
        >
          <div className="offui-prc-timeline-marker">
            <div className="offui-prc-timeline-dot">
              {item.status === 'completed' && (
                <span className="offui-prc-check">✓</span>
              )}
            </div>

            {index !== items.length - 1 && (
              <div
                className={`offui-prc-timeline-line ${
                  item.status === 'completed' ? 'offui-prc-line-active' : ''
                }`}
              />
            )}
          </div>

          <div className="offui-prc-content">
            <h3>{item.title}</h3>
            <p>{item.subtitle}</p>

            {item.status !== 'pending' && (
              <span
                className={`offui-prc-badge ${
                  item.status === 'completed' ? 'completed' : 'in-progress'
                }`}
              >
                {item.status === 'completed' ? 'COMPLETED' : 'IN PROGRESS'}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProcessTimeline;