import '@emotion/react';

declare module '@emotion/react' {
  export interface Theme {
    palette: {
      primaryText: string;
      secondaryText: string;
      background: string;
      surface: string;
      border: string;
      error: string;
      warning: string;
      info: string;
      success: string;
    };
  }
}
