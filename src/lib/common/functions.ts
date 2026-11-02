export function formatPhoneNumber(n: string): string {
	const digits = n.replace(/[()\-]/g, '');

	if (digits.length === 10) {
		return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
	}

	if (digits.length === 7) {
		return `${digits.slice(0, 3)}-${digits.slice(3)}`;
	}

	return n;
}

export function formatTimePeriod(p: string): string {
	const months = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec'
	];
	const year = p.slice(0, 4);
	const month = Number(p.slice(4, 6));

	return `${months[month - 1]} ${year}`;
}
