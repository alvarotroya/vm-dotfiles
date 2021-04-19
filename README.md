# vm-dotfiles
Dotfiles for local vm development environment

## Steps to automate

Install jetbrains-toolbox

`curl -s https://raw.githubusercontent.com/nagygergo/jetbrains-toolbox-install/master/jetbrains-toolbox.sh | bash`

Increase file watch

`sudo echo "fs.inotify.max_user_watches = 524288" >> /etc/sysctl.conf && sudo sysctl -p --system`

Make gnome-terminal the default terminal emulator
`sudo update-alternatives --config x-terminal-emulator`

Install tmux

`sudo apt install tmux`

Install tpm

`git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm`

Install vim-gnome

`sudo apt install vim-gnome`

Install vundle

`git clone https://github.com/VundleVim/Vundle.vim.git ~/.vim/bundle/Vundle.vim`

Create symbolic links for config files

Here, $CLONED_DIR stands for the **absolute path** of the directory where this repository has been cloned to.
`ln -s $CLONED_DIR/.ideavimrc ~/`

`ln -s $CLONED_DIR/.tmux.conf ~/`

`ln -s $CLONED_DIR/.bash_aliases ~/`

`ln -s $CLONED_DIR/.vimrc ~/`

Install gtk arc-dark theme

`sudo dpkg -i $CLONED_DIR/arc-theme/arc-theme_1488477732.766ae1a-0_all.deb`

Install openbox arc-dark theme

`obconf` and select *.obt file under `arc-theme`


