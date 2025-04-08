import { Doc, Id } from 'convex/_generated/dataModel';

import { DoneAction } from '~/components/actions/done';
import { GenericAction } from '~/components/actions/generic';
import { IterateAction } from '~/components/actions/iterate';
import { SayAction } from '~/components/actions/say';
import { ScrapeLinkAction } from '~/components/actions/scrapeLink';
import { SearchPlacesAction } from '~/components/actions/searchPlaces';
import { SearchWebAction } from '~/components/actions/searchWeb';
import { UpdateInstructionsAction } from '~/components/actions/updateInstructions';

const componentMap = {
	say: SayAction,
	iterate: IterateAction,
	done: DoneAction,
	askForClarification: SayAction,
	searchWeb: SearchWebAction,
	updateInstructions: UpdateInstructionsAction,
	scrapeLink: ScrapeLinkAction,
	searchPlaces: SearchPlacesAction,
};

export function Action(props: {
	className?: string;
	action: Doc<'actions'>;
	initialRenderDate: Date;
	isAuthorCurrentUser: boolean;
	taskId: Id<'tasks'>;
}) {
	//
	if (props.action.skillKey in componentMap) {
		const Component = componentMap[props.action.skillKey as keyof typeof componentMap];
		return <Component {...props} />;
	}

	return <GenericAction {...props} />;
}
