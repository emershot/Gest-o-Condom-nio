import React, { useState } from 'react';
import Modal from './Modal';
import Toast from './Toast';
import { ToastMessage } from '../types';
import { IMAGES } from '../constants';

// Tipos locais
interface PollOption {
  id: number;
  text: string;
  votes: number;
}

interface Comment {
  id: number;
  author: string;
  avatar?: string;
  text: string;
  timestamp: string;
  isAdmin?: boolean;
}

interface Post {
  id: number;
  type: 'notice' | 'poll' | 'message';
  author: {
    name: string;
    role: string;
    avatar?: string;
  };
  title: string;
  content: string;
  image?: string; // Novo campo para imagem
  timestamp: string;
  timestampObj: number;
  pinned?: boolean;
  urgent?: boolean;
  
  // Lógica de Engajamento
  likes: number;
  userLiked?: boolean;
  
  // Lógica de Enquete
  pollOptions?: PollOption[];
  userVoted?: number | null;
  
  // Lógica de Comentários
  commentsCount: number;
  commentsList: Comment[];
  showComments?: boolean; 
}

// Mock Data
const INITIAL_POSTS: Post[] = [
  {
    id: 1,
    type: 'notice',
    author: { name: 'Sarah Johnson', role: 'Síndica', avatar: IMAGES.USER_AVATAR },
    title: 'Manutenção Preventiva dos Elevadores',
    content: 'Informamos que na próxima terça-feira (15/12), realizaremos a manutenção preventiva nos elevadores do Bloco A das 09h às 14h.',
    timestamp: '2 horas atrás',
    timestampObj: Date.now() - 7200000,
    pinned: true,
    urgent: true,
    likes: 12,
    userLiked: true,
    commentsCount: 2,
    commentsList: [
      { id: 101, author: 'Carlos (105-A)', text: 'Obrigado pelo aviso, Sarah.', timestamp: '1 hora atrás', avatar: IMAGES.RESIDENT_1 },
      { id: 102, author: 'Maria (202-B)', text: 'O elevador de serviço estará liberado?', timestamp: '30 min atrás', avatar: IMAGES.RESIDENT_2 }
    ],
    showComments: false
  },
  {
    id: 2,
    type: 'poll',
    author: { name: 'Administração', role: 'CondoFlow', avatar: IMAGES.ADMIN_TOM },
    title: 'Decoração de Natal do Hall Principal',
    content: 'Qual temática vocês preferem para este ano?',
    timestamp: '1 dia atrás',
    timestampObj: Date.now() - 86400000,
    pollOptions: [
      { id: 1, text: 'Tradicional (Vermelho e Dourado)', votes: 45 },
      { id: 2, text: 'Inverno (Azul e Prata)', votes: 32 },
      { id: 3, text: 'Minimalista (Branco e Luzes)', votes: 18 }
    ],
    userVoted: null,
    likes: 24,
    userLiked: false,
    commentsCount: 1,
    commentsList: [
      { id: 201, author: 'Fernanda (Cobertura)', text: 'Votei no minimalista, acho mais elegante!', timestamp: '5 horas atrás', avatar: IMAGES.RESIDENT_OLIVIA }
    ],
    showComments: false
  },
  {
    id: 3,
    type: 'message',
    author: { name: 'Marcus Johnson', role: 'Morador (B-202)', avatar: IMAGES.RESIDENT_MARCUS },
    title: 'Achados e Perdidos: Chaves do Carro',
    content: 'Encontrei um molho de chaves de carro (Honda) próximo à piscina.',
    image: 'https://images.unsplash.com/photo-1622956276686-34072f91891e?q=80&w=600&auto=format&fit=crop', // Exemplo de imagem
    timestamp: '3 horas atrás',
    timestampObj: Date.now() - 10800000,
    likes: 8,
    userLiked: false,
    commentsCount: 0,
    commentsList: [],
    showComments: false
  }
];

const Communication: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [activeTab, setActiveTab] = useState<'all' | 'notice' | 'poll' | 'message'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Estado para inputs de comentário
  const [commentInputs, setCommentInputs] = useState<{[key: number]: string}>({});

  // Form State Criação
  const [newPost, setNewPost] = useState({
    type: 'notice',
    title: '',
    content: '',
    image: '',
    urgent: false,
    pinned: false
  });
  const [pollOptionsInput, setPollOptionsInput] = useState<string[]>(['', '']);

  // Helpers
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Actions
  const handleVote = (postId: number, optionId: number) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId && post.pollOptions) {
        const newOptions = post.pollOptions.map(opt => {
          let votes = opt.votes;
          if (post.userVoted === opt.id) votes--;
          if (optionId === opt.id && post.userVoted !== optionId) votes++;
          return { ...opt, votes };
        });
        const newUserVoted = post.userVoted === optionId ? null : optionId;
        return { ...post, pollOptions: newOptions, userVoted: newUserVoted };
      }
      return post;
    }));
  };

  const handleLike = (postId: number) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const isLiked = !!post.userLiked;
        return { 
          ...post, 
          likes: isLiked ? post.likes - 1 : post.likes + 1,
          userLiked: !isLiked 
        };
      }
      return post;
    }));
  };

  const handleDeletePost = (postId: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta publicação?")) {
      setPosts(prev => prev.filter(p => p.id !== postId));
      showToast('Publicação removida.', 'info');
    }
  };

  // Comment Logic
  const toggleComments = (postId: number) => {
    setPosts(prev => prev.map(post => 
      post.id === postId ? { ...post, showComments: !post.showComments } : post
    ));
  };

  const handleCommentInputChange = (postId: number, value: string) => {
    setCommentInputs(prev => ({ ...prev, [postId]: value }));
  };

  const submitComment = (postId: number) => {
    const text = commentInputs[postId];
    if (!text || text.trim() === '') return;

    const newComment: Comment = {
      id: Date.now(),
      author: 'Você (Síndico)',
      text: text,
      timestamp: 'Agora mesmo',
      avatar: IMAGES.USER_AVATAR,
      isAdmin: true
    };

    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          commentsList: [...post.commentsList, newComment],
          commentsCount: post.commentsCount + 1,
          showComments: true
        };
      }
      return post;
    }));

    setCommentInputs(prev => ({ ...prev, [postId]: '' })); 
    showToast('Comentário enviado!');
  };

  // Creation Logic
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptionsInput];
    newOptions[index] = value;
    setPollOptionsInput(newOptions);
  };

  const addOptionField = () => setPollOptionsInput([...pollOptionsInput, '']);

  const removeOptionField = (index: number) => {
    if (pollOptionsInput.length > 2) {
      setPollOptionsInput(pollOptionsInput.filter((_, i) => i !== index));
    } else {
      showToast('Uma enquete precisa de pelo menos 2 opções.', 'error');
    }
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();

    let finalPollOptions: PollOption[] | undefined = undefined;

    if (newPost.type === 'poll') {
      const validOptions = pollOptionsInput.filter(opt => opt.trim() !== '');
      if (validOptions.length < 2) {
        showToast('Adicione pelo menos 2 opções para a enquete.', 'error');
        return;
      }
      finalPollOptions = validOptions.map((text, index) => ({
        id: index + 1,
        text,
        votes: 0
      }));
    }

    const post: Post = {
      id: Date.now(),
      type: newPost.type as any,
      author: { name: 'Sarah Johnson', role: 'Síndica', avatar: IMAGES.USER_AVATAR },
      title: newPost.title,
      content: newPost.content,
      image: newPost.image || undefined,
      timestamp: 'Agora mesmo',
      timestampObj: Date.now(),
      pinned: newPost.pinned,
      urgent: newPost.urgent,
      likes: 0,
      userLiked: false,
      commentsCount: 0,
      commentsList: [],
      showComments: false,
      pollOptions: finalPollOptions
    };

    setPosts([post, ...posts]);
    setIsModalOpen(false);
    showToast('Publicação criada com sucesso!');
    setNewPost({ type: 'notice', title: '', content: '', image: '', urgent: false, pinned: false });
    setPollOptionsInput(['', '']);
  };

  // Filter & Sort
  const filteredPosts = posts
    .filter(post => {
      const matchesTab = activeTab === 'all' || post.type === activeTab;
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            post.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.timestampObj - a.timestampObj;
    });

  const getBadgeColor = (type: string) => {
    switch(type) {
      case 'notice': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'poll': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'message': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getTypeName = (type: string) => {
    switch(type) {
      case 'notice': return 'Comunicado';
      case 'poll': return 'Enquete';
      case 'message': return 'Mensagem';
      default: return 'Post';
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="fixed bottom-0 right-0 z-50 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mural de Comunicação</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Avisos, votações e interação com moradores.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input 
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A2234] text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none text-sm"
            />
            <span className="material-icons absolute left-3 top-2.5 text-slate-400 text-[20px]">search</span>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm shadow-blue-500/30 transition-all active:scale-95 text-sm font-medium whitespace-nowrap"
          >
            <span className="material-icons text-[20px]">edit</span>
            <span className="hidden sm:inline">Nova Publicação</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'all', label: 'Todos', icon: 'view_agenda' },
          { id: 'notice', label: 'Comunicados', icon: 'campaign' },
          { id: 'poll', label: 'Enquetes', icon: 'poll' },
          { id: 'message', label: 'Mensagens', icon: 'forum' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-primary text-white shadow-md shadow-primary/20' 
                : 'bg-white dark:bg-[#1A2234] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <span className="material-icons text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="space-y-4 max-w-3xl mx-auto">
        {filteredPosts.map(post => (
          <div key={post.id} className={`bg-white dark:bg-[#1A2234] rounded-xl border ${post.pinned ? 'border-primary/30 shadow-md ring-1 ring-primary/10' : 'border-slate-200 dark:border-slate-800 shadow-sm'} overflow-hidden transition-all animate-fade-in`}>
            
            {/* Post Header */}
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <img src={post.author.avatar || IMAGES.USER_AVATAR} alt={post.author.name} className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-slate-700" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {post.author.name}
                      {post.pinned && <span className="material-icons text-primary text-[16px]" title="Fixado">push_pin</span>}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{post.author.role} • {post.timestamp}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getBadgeColor(post.type)}`}>
                    {getTypeName(post.type)}
                  </span>
                  <button 
                    onClick={() => handleDeletePost(post.id)}
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                    title="Excluir"
                  >
                    <span className="material-icons text-[18px]">delete</span>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  {post.urgent && <span className="material-icons text-red-500 text-[20px]" title="Urgente">warning</span>}
                  {post.title}
                </h2>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line mb-3">
                  {post.content}
                </p>
                {/* Imagem do Post */}
                {post.image && (
                  <div className="rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800">
                    <img src={post.image} alt="Anexo da publicação" className="w-full h-auto object-cover max-h-80 hover:scale-105 transition-transform duration-500" />
                  </div>
                )}
              </div>

              {/* Poll */}
              {post.type === 'poll' && post.pollOptions && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-3 mb-4 border border-slate-100 dark:border-slate-800">
                  {post.pollOptions.map(option => {
                    const totalVotes = post.pollOptions!.reduce((acc, curr) => acc + curr.votes, 0);
                    const percentage = totalVotes === 0 ? 0 : Math.round((option.votes / totalVotes) * 100);
                    const isSelected = post.userVoted === option.id;

                    return (
                      <div key={option.id} className="relative">
                        <button
                          onClick={() => handleVote(post.id, option.id)}
                          className={`relative z-10 w-full text-left flex justify-between items-center p-3 rounded-lg border-2 transition-all ${
                            isSelected 
                              ? 'border-primary bg-primary/5 text-primary' 
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <span className="font-medium text-sm flex items-center gap-2">
                            {isSelected && <span className="material-icons text-[16px]">check_circle</span>}
                            {option.text}
                          </span>
                          <span className="text-xs font-bold">{percentage}% ({option.votes})</span>
                        </button>
                        <div 
                          className="absolute top-0 bottom-0 left-0 bg-slate-200 dark:bg-slate-700 rounded-lg transition-all duration-500 opacity-30 pointer-events-none"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    );
                  })}
                  <p className="text-xs text-slate-400 text-center mt-2">
                    {post.pollOptions.reduce((acc, curr) => acc + curr.votes, 0)} votos totais
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-1.5 transition-colors text-sm font-medium group ${
                    post.userLiked 
                      ? 'text-red-500' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-red-500'
                  }`}
                >
                  <span className={`material-icons text-[20px] group-hover:scale-110 transition-transform ${post.userLiked ? 'animate-bounce-short' : ''}`}>
                    {post.userLiked ? 'favorite' : 'favorite_border'}
                  </span>
                  {post.likes}
                </button>
                <button 
                  onClick={() => toggleComments(post.id)}
                  className={`flex items-center gap-1.5 transition-colors text-sm font-medium ${post.showComments ? 'text-primary' : 'text-slate-500 dark:text-slate-400 hover:text-primary'}`}
                >
                  <span className="material-icons text-[20px]">chat_bubble_outline</span>
                  {post.commentsCount} Comentários
                </button>
                <button className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors text-sm font-medium ml-auto">
                  <span className="material-icons text-[20px]">share</span>
                </button>
              </div>
            </div>

            {/* Comments Section */}
            {post.showComments && (
              <div className="bg-slate-50 dark:bg-slate-800/30 p-5 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
                
                {/* Comments List */}
                <div className="space-y-4 mb-5">
                   {post.commentsList.length > 0 ? (
                     post.commentsList.map(comment => (
                       <div key={comment.id} className="flex gap-3">
                         <img src={comment.avatar || IMAGES.USER_AVATAR} alt={comment.author} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0" />
                         <div className="flex-1 bg-white dark:bg-[#1A2234] rounded-lg rounded-tl-none p-3 shadow-sm border border-slate-200 dark:border-slate-700">
                           <div className="flex justify-between items-center mb-1">
                             <span className={`text-xs font-bold ${comment.isAdmin ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
                               {comment.author}
                               {comment.isAdmin && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px]">Síndico</span>}
                             </span>
                             <span className="text-[10px] text-slate-400">{comment.timestamp}</span>
                           </div>
                           <p className="text-sm text-slate-700 dark:text-slate-300">{comment.text}</p>
                         </div>
                       </div>
                     ))
                   ) : (
                     <p className="text-center text-xs text-slate-400 py-2">Seja o primeiro a comentar.</p>
                   )}
                </div>

                {/* Input Area */}
                <div className="flex gap-3 items-center">
                   <img src={IMAGES.USER_AVATAR} alt="Você" className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700" />
                   <div className="flex-1 relative">
                     <input 
                       type="text" 
                       value={commentInputs[post.id] || ''}
                       onChange={(e) => handleCommentInputChange(post.id, e.target.value)}
                       onKeyPress={(e) => e.key === 'Enter' && submitComment(post.id)}
                       placeholder="Escreva um comentário..."
                       className="w-full rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1A2234] py-2 pl-4 pr-12 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                     />
                     <button 
                       onClick={() => submitComment(post.id)}
                       disabled={!commentInputs[post.id]}
                       className="absolute right-1 top-1 p-1.5 bg-primary text-white rounded-full hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                     >
                       <span className="material-icons text-[16px] block">send</span>
                     </button>
                   </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {filteredPosts.length === 0 && (
           <div className="flex flex-col items-center justify-center py-12 text-slate-400">
             <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
               <span className="material-icons text-3xl opacity-50">search_off</span>
             </div>
             <p className="font-medium">Nenhuma publicação encontrada.</p>
           </div>
        )}
      </div>

      {/* Modal Criar Post */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nova Publicação"
        onSubmit={handleCreatePost}
        submitLabel="Publicar"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Publicação</label>
            <div className="grid grid-cols-3 gap-2">
              <button 
                type="button" 
                onClick={() => setNewPost({...newPost, type: 'notice'})}
                className={`p-2 rounded-lg border text-sm font-medium flex flex-col items-center gap-1 transition-all ${newPost.type === 'notice' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
              >
                <span className="material-icons">campaign</span>
                Comunicado
              </button>
              <button 
                 type="button" 
                 onClick={() => setNewPost({...newPost, type: 'poll'})}
                 className={`p-2 rounded-lg border text-sm font-medium flex flex-col items-center gap-1 transition-all ${newPost.type === 'poll' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
              >
                <span className="material-icons">poll</span>
                Enquete
              </button>
              <button 
                 type="button" 
                 onClick={() => setNewPost({...newPost, type: 'message'})}
                 className={`p-2 rounded-lg border text-sm font-medium flex flex-col items-center gap-1 transition-all ${newPost.type === 'message' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
              >
                <span className="material-icons">forum</span>
                Mensagem
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título</label>
            <input 
              value={newPost.title}
              onChange={(e) => setNewPost({...newPost, title: e.target.value})}
              type="text" 
              className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" 
              placeholder={newPost.type === 'poll' ? "Pergunta da Enquete" : "Título do comunicado"} 
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {newPost.type === 'poll' ? 'Descrição / Contexto' : 'Conteúdo'}
            </label>
            <textarea 
              value={newPost.content}
              onChange={(e) => setNewPost({...newPost, content: e.target.value})}
              rows={4} 
              className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" 
              placeholder="Escreva os detalhes aqui..." 
              required 
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Imagem (Opcional)</label>
             <input 
               value={newPost.image}
               onChange={(e) => setNewPost({...newPost, image: e.target.value})}
               type="text" 
               className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" 
               placeholder="https://..." 
             />
             <p className="text-[10px] text-slate-400 mt-1">Cole o link direto da imagem.</p>
          </div>

          {newPost.type === 'poll' && (
             <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800 space-y-3">
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Opções da Enquete</label>
               {pollOptionsInput.map((option, index) => (
                 <div key={index} className="flex gap-2">
                   <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Opção ${index + 1}`}
                      className="flex-1 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                      required
                   />
                   {pollOptionsInput.length > 2 && (
                     <button
                       type="button"
                       onClick={() => removeOptionField(index)}
                       className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg"
                     >
                       <span className="material-icons text-[18px]">close</span>
                     </button>
                   )}
                 </div>
               ))}
               <button
                 type="button"
                 onClick={addOptionField}
                 className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
               >
                 <span className="material-icons text-[16px]">add</span> Adicionar Opção
               </button>
             </div>
          )}

          <div className="flex items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 dark:text-slate-300">
              <input 
                type="checkbox" 
                checked={newPost.urgent}
                onChange={(e) => setNewPost({...newPost, urgent: e.target.checked})}
                className="w-4 h-4 rounded border-slate-300 text-red-500 focus:ring-red-500" 
              />
              Marcar como Urgente
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 dark:text-slate-300">
              <input 
                type="checkbox" 
                checked={newPost.pinned}
                onChange={(e) => setNewPost({...newPost, pinned: e.target.checked})}
                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" 
              />
              Fixar no Topo
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Communication;