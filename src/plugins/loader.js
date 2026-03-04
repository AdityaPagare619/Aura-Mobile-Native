import { Filesystem, Directory } from '@capacitor/filesystem';

/**
 * AI Plugin Loader
 * This reads JavaScript files directly from the Android 'Documents/AuraPlugins' folder.
 * When the AI writes a new feature to the phone, this loader parses and evaluates it
 * allowing UI hot-reloading inside the natively compiled app without internet or servers.
 */
export class PluginEngine {
    async initPluginDirectory() {
        try {
            // Ensure the plugin directory exists on the local filesystem
            await Filesystem.mkdir({
                path: 'AuraPlugins',
                directory: Directory.Documents,
                recursive: true
            });
            console.log('Plugin directory ready.');
        } catch (e) {
            // Ignore if it already exists
        }
    }

    async loadActivePlugins() {
        try {
            const result = await Filesystem.readdir({
                path: 'AuraPlugins',
                directory: Directory.Documents
            });

            const jsFiles = result.files.filter(f => f.name.endsWith('.js'));
            const plugins = [];

            for (const file of jsFiles) {
                const contents = await Filesystem.readFile({
                    path: `AuraPlugins/${file.name}`,
                    directory: Directory.Documents,
                    encoding: 'utf8',
                });

                // In a true production environment, instead of eval, 
                // a secure sandbox (like isolated VM or safe JSON AST) is used.
                // For zero-server dynamic React injection on local devices,
                // we execute the stringified React component function.
                try {
                    // Evaluate the AI-generated code to extract the component
                    // The AI must return a function: `return function MyComponent({mode}) { ... }`
                    const WidgetComponent = new Function('React', contents.data)(window.React);
                    if (typeof WidgetComponent === 'function') {
                        plugins.push({ id: file.name, Component: WidgetComponent });
                    }
                } catch (compileErr) {
                    console.error(`Failed to compile AI plugin ${file.name}:`, compileErr);
                }
            }

            return plugins;

        } catch (e) {
            console.error('Failed to read plugins:', e);
            return [];
        }
    }
}

export const aiEngine = new PluginEngine();
