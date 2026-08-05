import Icon from '@/components/wrappers/Icon';
import clsx from 'clsx';

interface WaitingRoomIconAvatarProps {
  className?: string;
  icon: string;
  iconClassName?: string;
  shape?: 'circle' | 'rounded';
  size?: 'xs' | 'sm';
  titleClassName?: string;
  variant?: string;
}

const WaitingRoomIconAvatar = ({
  className,
  icon,
  iconClassName,
  shape = 'rounded',
  size = 'sm',
  titleClassName,
  variant = 'primary',
}: WaitingRoomIconAvatarProps) => (
  <span className={clsx(`avatar-${size}`, 'flex-shrink-0', className)}>
    <span
      className={clsx(
        'avatar-title',
        shape === 'circle' ? 'rounded-circle' : 'rounded',
        `bg-${variant}-subtle`,
        `text-${variant}`,
        titleClassName,
      )}
    >
      <Icon className={iconClassName} icon={icon} />
    </span>
  </span>
);

export default WaitingRoomIconAvatar;
