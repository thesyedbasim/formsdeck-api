import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import Cors from 'cors';

const cors = Cors({ origin: '*', methods: ['POST'] });

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
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

	// s09457348548--skdjflskdjfoisjof
	// https://discord.com/api/webhooks/s09457348548--skdjflskdjfoisjof
	const { responseSendURL: responseSendURLRaw } = req.query;
	const responseSendURL = generateDiscordURL(responseSendURLRaw as string);

	console.log('req body', req.body);

	try {
		if (req.method !== 'POST') throw new Error('Invalid request');

		const fields = Object.entries(req.body).map(([key, value]) => ({
			name: key,
			value:
				typeof value === 'string'
					? !value || value.trim().length === 0
						? 'N/A'
						: value
					: `${value}`
		}));

		if (!responseSendURL || responseSendURL.trim().length === 0)
			throw new Error('No form action specified.');

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

		res.end();
	} catch (err) {
		res
			.status(500)
			.send(
				'Oops! Your response was not recorded. There was some error on our side. Sorry for inconvinience.'
			);
	}
}
