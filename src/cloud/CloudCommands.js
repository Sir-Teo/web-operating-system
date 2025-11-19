/**
 * CloudCommands - Terminal commands for cloud storage operations
 * Provides CLI interface to CloudStorageManager
 */

export function registerCloudCommands(terminal, cloudManager) {
  /**
   * cloud connect - Connect to a cloud provider
   * Usage: cloud connect <type> <options...>
   */
  terminal.registerCommand('cloud', {
    description: 'Cloud storage operations',
    usage: 'cloud <subcommand> [options]',
    async execute(args, context) {
      if (args.length === 0) {
        return this.showHelp();
      }

      const subcommand = args[0];

      switch (subcommand) {
        case 'connect':
          return await this.connect(args.slice(1), context);
        case 'disconnect':
          return await this.disconnect(args.slice(1), context);
        case 'list':
          return await this.list(args.slice(1), context);
        case 'upload':
          return await this.upload(args.slice(1), context);
        case 'download':
          return await this.download(args.slice(1), context);
        case 'providers':
          return this.providers();
        case 'status':
          return this.status();
        default:
          return `Unknown subcommand: ${subcommand}\nUse 'cloud help' for usage.`;
      }
    },

    showHelp() {
      return `Cloud Storage Commands:
  cloud connect <type> <url> <username> <password>  - Connect to cloud provider
  cloud disconnect <provider-id>                     - Disconnect from provider
  cloud list <provider-id> <path>                    - List cloud files
  cloud upload <local-path> <provider-id> <cloud-path> - Upload file
  cloud download <provider-id> <cloud-path> <local-path> - Download file
  cloud providers                                    - List connected providers
  cloud status                                       - Show cloud status

Supported provider types:
  webdav    - WebDAV server
  mock      - Mock provider (for testing)

Examples:
  cloud connect webdav https://dav.example.com user pass
  cloud list provider-123 /documents
  cloud upload /home/user/file.txt provider-123 /backup/file.txt`;
    },

    async connect(args, context) {
      if (args.length < 4) {
        return 'Usage: cloud connect <type> <url> <username> <password>';
      }

      const [type, url, username, password] = args;

      try {
        const providerId = await cloudManager.connect(type, {
          baseUrl: url,
          username,
          password
        });

        return `Connected to ${type} provider: ${providerId}`;
      } catch (error) {
        return `Error: ${error.message}`;
      }
    },

    async disconnect(args, context) {
      if (args.length < 1) {
        return 'Usage: cloud disconnect <provider-id>';
      }

      const [providerId] = args;

      try {
        await cloudManager.disconnect(providerId);
        return `Disconnected from provider: ${providerId}`;
      } catch (error) {
        return `Error: ${error.message}`;
      }
    },

    async list(args, context) {
      if (args.length < 2) {
        return 'Usage: cloud list <provider-id> <path>';
      }

      const [providerId, path] = args;

      try {
        const files = await cloudManager.list(providerId, path);

        if (files.length === 0) {
          return 'No files found';
        }

        let output = '';
        for (const file of files) {
          const type = file.type === 'directory' ? 'd' : '-';
          const size = file.size ? `${file.size}B` : '';
          const modified = file.modified ? file.modified.toLocaleString() : '';
          output += `${type} ${file.name.padEnd(30)} ${size.padStart(10)} ${modified}\n`;
        }

        return output.trimEnd();
      } catch (error) {
        return `Error: ${error.message}`;
      }
    },

    async upload(args, context) {
      if (args.length < 3) {
        return 'Usage: cloud upload <local-path> <provider-id> <cloud-path>';
      }

      const [localPath, providerId, cloudPath] = args;

      try {
        const result = await cloudManager.upload(localPath, providerId, cloudPath);
        return `Uploaded ${result.size} bytes from ${result.localPath} to ${result.cloudPath}`;
      } catch (error) {
        return `Error: ${error.message}`;
      }
    },

    async download(args, context) {
      if (args.length < 3) {
        return 'Usage: cloud download <provider-id> <cloud-path> <local-path>';
      }

      const [providerId, cloudPath, localPath] = args;

      try {
        const result = await cloudManager.download(providerId, cloudPath, localPath);
        return `Downloaded ${result.size} bytes from ${result.cloudPath} to ${result.localPath}`;
      } catch (error) {
        return `Error: ${error.message}`;
      }
    },

    providers() {
      const providers = cloudManager.getProviders();

      if (providers.length === 0) {
        return 'No providers connected';
      }

      let output = 'Connected Providers:\n';
      for (const provider of providers) {
        output += `  ${provider.id}\n`;
        output += `    Name: ${provider.name}\n`;
        output += `    Authenticated: ${provider.authenticated}\n`;
        if (provider.quota && provider.quota.total > 0) {
          const usedGB = (provider.quota.used / (1024 * 1024 * 1024)).toFixed(2);
          const totalGB = (provider.quota.total / (1024 * 1024 * 1024)).toFixed(2);
          output += `    Quota: ${usedGB}GB / ${totalGB}GB\n`;
        }
      }

      return output.trimEnd();
    },

    status() {
      const status = cloudManager.getStatus();

      let output = 'Cloud Storage Status:\n';
      output += `  Providers: ${status.providers}\n`;
      output += `  Mounts: ${status.mounts}\n`;
      output += `  Active Syncs: ${status.activeSyncs}\n`;

      if (status.mountList.length > 0) {
        output += '\nActive Mounts:\n';
        for (const mount of status.mountList) {
          output += `  ${mount.mountPoint} -> ${mount.cloudPath} (${mount.providerId})\n`;
        }
      }

      return output.trimEnd();
    }
  });

  /**
   * mount - Mount cloud storage to local path
   * Usage: mount <provider>:<cloud-path> <local-path>
   */
  terminal.registerCommand('mount', {
    description: 'Mount cloud storage to local filesystem',
    usage: 'mount <provider-id>:<cloud-path> <local-path> [options]',
    async execute(args, context) {
      if (args.length < 2) {
        return 'Usage: mount <provider-id>:<cloud-path> <local-path> [--sync] [--watch]';
      }

      const [source, mountPoint, ...options] = args;

      // Parse source (provider:path)
      const colonIndex = source.indexOf(':');
      if (colonIndex === -1) {
        return 'Invalid source format. Use: provider-id:/cloud/path';
      }

      const providerId = source.substring(0, colonIndex);
      const cloudPath = source.substring(colonIndex + 1);

      // Parse options
      const mountOptions = {
        sync: options.includes('--sync'),
        watch: options.includes('--watch'),
        syncInterval: 60000 // 1 minute
      };

      try {
        const result = await cloudManager.mount(providerId, cloudPath, mountPoint, mountOptions);
        let output = `Mounted ${cloudPath} to ${mountPoint}`;
        if (result.syncing) {
          output += ' (syncing enabled)';
        }
        return output;
      } catch (error) {
        return `Error: ${error.message}`;
      }
    }
  });

  /**
   * umount - Unmount cloud storage
   * Usage: umount <mount-point>
   */
  terminal.registerCommand('umount', {
    description: 'Unmount cloud storage',
    usage: 'umount <mount-point>',
    async execute(args, context) {
      if (args.length < 1) {
        return 'Usage: umount <mount-point>';
      }

      const [mountPoint] = args;

      try {
        await cloudManager.unmount(mountPoint);
        return `Unmounted ${mountPoint}`;
      } catch (error) {
        return `Error: ${error.message}`;
      }
    }
  });

  /**
   * sync - Synchronize local and cloud directories
   * Usage: sync <local-path> <provider-id>:<cloud-path>
   */
  terminal.registerCommand('sync', {
    description: 'Synchronize local and cloud directories',
    usage: 'sync <local-path> <provider-id>:<cloud-path> [--strategy=<strategy>]',
    async execute(args, context) {
      if (args.length < 2) {
        return 'Usage: sync <local-path> <provider-id>:<cloud-path> [--strategy=keep-both|local-wins|cloud-wins|newest-wins]';
      }

      const [localPath, source, ...options] = args;

      // Parse source (provider:path)
      const colonIndex = source.indexOf(':');
      if (colonIndex === -1) {
        return 'Invalid source format. Use: provider-id:/cloud/path';
      }

      const providerId = source.substring(0, colonIndex);
      const cloudPath = source.substring(colonIndex + 1);

      // Parse options
      const syncOptions = {};
      for (const option of options) {
        if (option.startsWith('--strategy=')) {
          syncOptions.conflictStrategy = option.substring('--strategy='.length);
        }
      }

      try {
        const result = await cloudManager.sync(localPath, providerId, cloudPath, syncOptions);
        return `Sync complete:
  Uploaded: ${result.uploaded} files
  Downloaded: ${result.downloaded} files
  Conflicts: ${result.conflicts}`;
      } catch (error) {
        return `Error: ${error.message}`;
      }
    }
  });
}
