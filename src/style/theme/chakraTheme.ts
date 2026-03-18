import { extendTheme } from "@chakra-ui/react";
import '@fontsource/titillium-web';
import '@fontsource/roboto';
import '@fontsource/open-sans/300.css';
import '@fontsource/open-sans/400.css';
import '@fontsource/open-sans/600.css';
import '@fontsource/open-sans/700.css';
import '@fontsource/open-sans/800.css';

const fonts = {
  TitilliumWeb: 'Titillium Web, sans-serif',
  Roboto: 'Roboto',
  OpenSans: 'Open Sans, sans-serif',
  Nanum: `'NanumSquareEB', sans-serif`,
}

const theme = extendTheme({
  initialColorMode: 'light',
  fonts: {
    TitilliumWeb: 'Titillium Web, sans-serif',
    Roboto: 'Roboto',
    OpenSans: 'Open Sans, sans-serif',
  },

	breakpoints: {
		base: "0px",
		sm: "360px",
		md: "799px",
		lg: "1200px",
	},

	components: {
		Slider: {
			baseStyle: {
				thumb: {
					bg: "#FAFBFC",
					transition: "none",
					_active: {
						outline: "none",
						border: "none",
					},
					_focused: {
						outline: "none",
						border: "none",
					},
				},
			},
		},
		// Drawer: {
		// 	variants: {
		// 		clickThrough: {
		// 			overlay: {
		// 				pointerEvents: "none",
		// 				background: "transparent",
		// 			},

		// 			dialogContainer: {
		// 				pointerEvents: "none",
		// 				background: "transparent",
		// 			},
		// 			dialog: {
		// 				pointerEvents: "auto",
		// 			},
		// 			input: {
		// 				pointerEvents: "auto",
		// 			},
		// 		},
		// 	},
		// },
	},

	styles: {
		global: () => ({
			// Reset all styles
			"*": {
				// all: "unset",
				// animation: "none",
				// transition: "none",
				// transform: "none",
				outline: "none",
				boxshadow: "none",
			},

			"html, body": {
				backgroundColor: "#fafbfc",
				color: "#3d495d",
			},
			".header-right-common": {
				backgroundColor: "#FAFBFC",
				borderRadius: "8px",
				cursor: "pointer",
			},
			".card-wrapper": {
				flexDir: "column",
				border: "1px solid #1f2128",
				alignItems: "center",
				pt: "16px",
				borderRadius: "8px",
			},
			".card": {
				minWidth: "200px",
				minHeight: "248px",
				maxWidth: "200px",
				maxHeight: "248px",
			},
			".card-empty": {
				border: "1px dashed #313442",
				borderRadius: "16px",
			},
		}),
		// Additional overrides for specific components can be added here
		// For example, to reset the button styles
		Button: {
			baseStyle: {
				// Reset button styles
				borderRadius: "none",
				boxShadow: "none",
				fontWeight: "normal",
				_hover: { backgroundColor: "none" },
				_active: {},
				color: "#fff",
			},
		},
		Input: {
			baseStyle: {
				// Reset button styles
				borderRadius: "none",
				boxShadow: "none",
				fontWeight: "normal",
				_hover: { backgroundColor: "none" },
				_active: {},
			},
		},
	},
});

export { theme };
