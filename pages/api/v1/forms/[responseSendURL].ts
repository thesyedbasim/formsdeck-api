import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import Cors from 'cors';
import UserApiError from '../../../../lib/classes/UserApiError';

const cors = Cors({ origin: '*', methods: ['POST'] });

function runMiddleware(
	req: NextApiRequest,
	res: NextApiResponse,
	fn: (
		req: Cors.CorsRequest,
		res: {
			statusCode?: number | undefined;
			setHeader(key: string, value: string): any;
			end(): any;
		},
		next: (err?: any) => any
	) => void
) {
	return new Promise((resolve, reject) => {
		fn(req, res, (result) => {
			if (result instanceof Error) {
				return reject(result);
			}

			return resolve(result);
		});
	});
}

const generateDiscordURL = (raw: string): string => {
	let generatedURL: string | string[] = raw.split('--');
	generatedURL.unshift('https://discord.com/api/webhooks/');
	generatedURL = generatedURL.join('/');

	return generatedURL;
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
	runMiddleware(req, res, cors);

	const { responseSendURL: responseSendURLRaw } = req.query;
	const responseSendURL = generateDiscordURL(responseSendURLRaw as string);

	try {
		if (req.method !== 'POST')
			throw new UserApiError(
				'This URI only accepts POST http requests for form submission.',
				400
			);

		if (!req.body || Object.entries(req.body).length === 0)
			throw new UserApiError('Form is empty, no inputs.', 400);

		const fields = Object.entries(req.body).map(([key, value]) => ({
			name: key || 'N/A',
			value:
				typeof value === 'string'
					? !value || value.trim().length === 0
						? 'N/A'
						: value
					: `${value}`
		}));

		if (!responseSendURL || responseSendURL.trim().length === 0)
			throw new UserApiError('No form action specified.', 400);

		const discordEmbed = { fields } || {
			description:
				"Looks like the form doesn't have input fields. Got empty request."
		};

		axios.post(
			responseSendURL,
			{
				embeds: [discordEmbed]
			},
			{ headers: { 'Content-Type': 'application/json' } }
		);

		res.status(201).send('Your form was submitted successfully.');
		res.end();
	} catch (err) {
		if (err instanceof UserApiError) {
			res.status(err.statusCode).send(err.message);

			return;
		}

		res
			.status(500)
			.send(
				'Oops! Your response was not recorded. There was some error on our side. Sorry for inconvinience.'
			);
	}
}
