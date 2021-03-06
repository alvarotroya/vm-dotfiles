set nocompatible              " be iMproved, required
filetype off                  " required for vundle (disabled after vundle#end()

set rtp+=~/.vim/bundle/Vundle.vim
call vundle#begin()

" ==== PLUGINS ====
Plugin 'VundleVim/Vundle.vim'
Plugin 'scrooloose/nerdtree'
Plugin 'airblade/vim-gitgutter'
Plugin 'ctrlpvim/ctrlp.vim'
Plugin 'easymotion/vim-easymotion'
Plugin 'tpope/vim-surround'
Plugin 'tpope/vim-commentary'
Plugin 'tpope/vim-fugitive'
Plugin 'vim-airline/vim-airline'
Plugin 'vim-airline/vim-airline-themes'
Plugin 'tpope/vim-unimpaired'

" ==== PLUGIN THEMES ====
Plugin 'vim-scripts/darktango.vim'
Plugin 'jonathanfilip/vim-lucius'
Plugin 'morhetz/gruvbox'
" ==== END PLUGIN THEMES ====

" ==== END PLUGINS ====

call vundle#end()
filetype plugin indent on

" ==== BASIC ====
let mapleader = " "
let maplocalleader = " "
colorscheme gruvbox
set guifont=Monospace\ 11
set fillchars+=vert:\$
syntax enable
set background=dark
set ruler
set hidden
set relativenumber
set number
set laststatus=2
"set smartindent
set autoindent
set cindent
"set st=4 sw=4 et
set tabstop=8 softtabstop=0 expandtab shiftwidth=4 smarttab
"let &colorcolumn="80"
:set guioptions-=m  "remove menu bar
:set guioptions-=T  "remove toolbar
:set guioptions-=r  "remove right-hand scroll bar
:set guioptions-=L  "remove left-hand scroll bar
" :set lines=999 columns=999 //too much lines and columns

" ==== CtrlP ====
let g:ctrlp_show_hidden = 1
let g:ctrlp_custom_ignore = '\v[\/]\.(git|hg|svn|mp3|pdf|jpg|png|tar|deb|mp4)$'
let g:ctrlp_cmd = 'CtrlPMRU'
let g:ctrlp_open_multiple_files = '10'

" ==== NERDTREE ====
let NERDTreeIgnore = ['\.pyc$', '\.o$', '\.so$', '\.a$', '[a-zA-Z]*egg[a-zA-Z]*', '[a-zA-Z]*cache[a-zA-Z]*']
let g:NERDTreeWinPos="left"
let g:NERDTreeDirArrows=0
map <C-t> :NERDTreeToggle<CR>

" ==== Airline ====
let g:airline_theme='luna'
let g:airline#extensions#tabline#buffer_nr_show = 1
let g:airline#extensions#tabline#enabled = 1
let g:airline#extensions#syntastic#enabled = 1

" ==== Easymotion ====
let g:EasyMotion_do_mapping = 1
let g:EasyMotion_smartcase = 1
nmap <Leader>f <Plug>(easymotion-bd-f)
"nmap f <Plug>(easymotion-bd-f)
"nmap <Leader>f <Plug>(easymotion-bd-fn)
nmap <Leader>s <Plug>(easymotion-bd-f2)

"makes ?mapleader work as trigger
map <Leader> <Plug>(easymotion-prefix) 

"Move to word
map  <Leader>w <Plug>(easymotion-bd-w)
map  <Leader>W <Plug>(easymotion-bd-W)

"n character search
map <Leader>/ <Plug>(easymotion-sn)
omap <Leader>/ <Plug>(easymotion-tn)

map <Leader>l <Plug>(easymotion-lineforward)
map <Leader>j <Plug>(easymotion-j)
map <Leader>k <Plug>(easymotion-k)
map <Leader>h <Plug>(easymotion-linebackward)
"let g:EasyMotion_startofline = 0 " keep cursor column when JK motion

" ==== Window navigation ====
map <C-a> <C-W>
map <C-j> <C-W>j
map <C-k> <C-W>k
map <C-h> <C-W>h
map <C-l> <C-W>l

nmap <silent> <Esc>j <C-W>j
nmap <silent> <Esc>k <C-W>k
nmap <silent> <Esc>h <C-W>h
nmap <silent> <Esc>l <C-W>l

" map <C-j> <C-W>j<C-W>_
" map <C-k> <C-W>k<C-W>
" map <C-h> <C-W>h<C-W>_
" map <C-l> <C-W>l<C-W>

" Make VIM remember position in file after reopen
autocmd BufReadPost * if line("'\"") > 1 && line("'\"") <= line("$") | exe "normal! g'\"" | endif

" Set X11 clipboard to default clipboard
set clipboard=unnamedplus

" Highlight search results
set hlsearch

"Highlight matching brackets
set showmatch

" Turn backup off, since most stuff is in SVN, git et.c anyway...
set nobackup
set nowb
set noswapfile

"Change pwd to the current file automatically
set autochdir

" Linebreak on 1000 characters
set lbr
set tw=1000

"set ai "Auto indent
"set si "Smart indent
set wrap "Wrap lines

"double scape to save
map <Esc><Esc> :w<CR>

"compile shortcut for python
map <F3> <Esc><Esc>:! python %<CR>

"spell checking shortcut
map <F6> <esc>:setlocal spell! spelllang=de_de<CR>
"map <F6> <esc>:setlocal spell! spelllang=en_gb<CR>

"nmap <C-o> <Nop>
map <F2> :so $MYVIMRC<CR>

"quick buffer switching
"nnoremap  <silent>   <tab>  :if &modifiable && !&readonly && &modified <CR> :write<CR> :endif<CR>:bnext<CR>
"nnoremap  <silent> <s-tab>  :if &modifiable && !&readonly && &modified <CR> :write<CR> :endif<CR>:bprevious<CR>
nnoremap  <silent>   <tab>  :bnext<CR>
nnoremap  <silent> <s-tab>  :bprevious<CR>

"Start ranger from VIM
"function RangerExplorer()
"    exec "silent !ranger --choosefile=/tmp/vim_ranger_current_file " . expand("%:p:h")
"    if filereadable('/tmp/vim_ranger_current_file')
"        exec 'edit ' . system('cat /tmp/vim_ranger_current_file')
"        call system('rm /tmp/vim_ranger_current_file')
"    endif
"    redraw!
"endfun
"map <Leader>r :call RangerExplorer()<CR>

" Add more delimiter with corresponding text object actions
for char in [ '_', '.', ':', ',', ';', '<bar>', '/', '<bslash>', '*', '+', '%' ]
  execute 'xnoremap i' . char . ' :<C-u>normal! T' . char . 'vt' . char . '<CR>'
  execute 'onoremap i' . char . ' :normal vi' . char . '<CR>'
  execute 'xnoremap a' . char . ' :<C-u>normal! F' . char . 'vf' . char . '<CR>'
  execute 'onoremap a' . char . ' :normal va' . char . '<CR>'
endfor

nnoremap <expr> j v:count ? 'j' : 'gj'
nnoremap <expr> k v:count ? 'k' : 'gk'

"Navigating with guides
inoremap <Space><Space> <Esc>/<++><Enter>"_c4l
vnoremap <Space><Space> <Esc>/<++><Enter>"_c4l
map <Space><Space> <Esc>/<++><Enter>"_c4l
inoremap ;gui <++>

"Save folds on exit
"au BufWinLeave ?* mkview
"au BufWinEnter ?* silent! loadview

"Shortcut for brackets
inoremap ;( <C-g>u()<++><Esc>T(i
inoremap ;[ <C-g>u[]<++><Esc>T[i
inoremap ;{ <C-g>u{}<++><Esc>T{i
