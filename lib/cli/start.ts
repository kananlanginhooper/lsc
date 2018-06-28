'use strict';

import flatiron = require('flatiron')
import path = require('path')
import _ = require('lodash')
import {isPackageSync} from "./utils"
import {checkVersion} from "../check-self-update"
import labShare from '../labshare'
import loaderPlugin = require('./loader-plugin')

const {app} = flatiron,
    cwd = process.cwd(),
    lscRoot = path.join(__dirname, '..', '..');

export interface IStartOptions {
    directories?: string[]
    pattern?: string
    main?: string
    initFunctions?: ((error?: Error) => any)[]
}

interface IPackageJson {
    description: string
    version: string
}

/**
 * @description Bootstraps the CLI
 * @param {string} main - Root project location
 * @param {Array<string>} [directories] - Additional project directories to search for CLI commands
 * @param {string} pattern - The CLI module pattern to search for (glob syntax)
 * @param {Array<Function>} initModules - Array of custom initializer functions
 */
export function start({
                          main = cwd,
                          directories = [lscRoot],
                          pattern = '{src/cli,cli}/*.js',
                          initFunctions = []
                      }: IStartOptions) {
    let pkg: IPackageJson;

    checkVersion({name: 'lsc', logger: app.log});

    if (isPackageSync(main)) {
        app.config.file({
            file: path.join(main, 'config.json')
        });
        pkg = require(path.join(main, 'package.json'));
    } else {
        pkg = require(path.join(lscRoot, 'package.json'));
        app.config.file({
            file: path.join(lscRoot, 'config.json')
        });
    }

    app.title = `${pkg.description} ${pkg.version}`;
    app.use(flatiron.plugins.cli, {
        usage: [app.title,
            '',
            'Usage:',
            'lsc <command>            - run a command',
            'lsc help                 - list all commands',
            'lsc help <command>       - display help for a specific command',
            '',
            '   --config <file-path>  - load a JSON configuration file (optional)'
        ],
        version: true
    });

    app.use(require('flatiron-cli-config'));
    app.use(loaderPlugin, {
        main,
        directories,
        pattern,
        initFunctions
    });

    global.LabShare = labShare;

    app.start(error => {
        if (_.isError(error)) {
            app.log.error(error.stack);
            process.exit(1);
        }
    });
}