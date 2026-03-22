import { writable } from 'svelte/store';

type ErrorState = {
	open: boolean;
	message: string;
};

export const errorDialog = writable<ErrorState>({
	open: false,
	message: ''
});

export const showError = (message: string) => {
	errorDialog.set({ open: true, message });
};

export const clearError = () => {
	errorDialog.update((state) => ({ ...state, open: false }));
};
