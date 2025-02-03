import { ListAndDetail } from '~/components/layout/ListAndDetail';
import { useIsMobile } from '~/hooks/useIsMobile';

export function ReversableListAndDetail({
	list,
	detail,
	className,
	defaultListSize = 30,
}: {
	list: React.ReactNode;
	detail?: React.ReactNode;
	defaultListSize?: number;
	className?: string;
}) {
	const isMobile = useIsMobile();

	return (
		<ListAndDetail
			list={isMobile ? detail : list}
			detail={isMobile ? list : detail}
			defaultListSize={defaultListSize}
			className={className}
		/>
	);
}
