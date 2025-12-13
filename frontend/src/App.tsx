import { Client as Styletron } from 'styletron-engine-atomic';
import { Provider as StyletronProvider } from 'styletron-react';
import { DarkTheme, BaseProvider } from 'baseui';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { queryClient } from './api/client';
import { router } from './router';

const engine = new Styletron();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StyletronProvider value={engine}>
        <BaseProvider theme={DarkTheme}>
          <RouterProvider router={router} />
        </BaseProvider>
      </StyletronProvider>
    </QueryClientProvider>
  );
}

export default App;
