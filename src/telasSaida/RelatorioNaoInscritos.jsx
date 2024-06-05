import React, { useState } from 'react';
import { Button, Container, Modal, Form, Popover, OverlayTrigger } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { buscarAlunos, atualizarAluno } from '../redux/alunoReducer';
import { buscarInscricoes } from '../redux/inscricaoReducer';
import { useEffect } from 'react';
import { format } from 'date-fns';
import Pagina from '../templates/Pagina';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { MdFileDownload } from "react-icons/md";
import { TfiWrite } from "react-icons/tfi";
import { IoPersonRemove } from "react-icons/io5";
import '../templates/style.css';
import 'react-toastify/dist/ReactToastify.css';
import { AlignmentType, Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, HeadingLevel } from "docx";
import { IoInformationCircleSharp } from "react-icons/io5";

export default function RelatorioAlunosNaoInscritos(props) {
    const [termoBusca, setTermoBusca] = useState('');
    const { alunos } = useSelector(state => state.aluno);
    const { inscricoes } = useSelector(state => state.inscricao);
    const [nomeArquivo, setNomeArquivo] = useState('');
    const [modalArquivo, setModalArquivo] = useState(false);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [motivoInativo, setMotivoInativo] = useState('');
    const [outroMotivo, setOutroMotivo] = useState('');
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(buscarAlunos());
        dispatch(buscarInscricoes());
    }, [dispatch]);

    // const anoAtual = new Date().getFullYear();
    const anoAtual = 2025;

    const alunosAtivos = alunos.filter(aluno => aluno.status === 'A'
        && (aluno.nome.toLowerCase().includes(termoBusca.toLowerCase()) || aluno.rg.includes(termoBusca)));

    const alunosInscritosOutrosAnos = inscricoes
        .filter(inscricao => inscricao.ano !== anoAtual)
        .map(inscricao => inscricao);

    const alunosInscritosAnoAtual = inscricoes
        .filter(inscricao => inscricao.ano === anoAtual)
        .map(inscricao => inscricao);

    const alunosNaoInscritosAnoAtual = alunosInscritosOutrosAnos.filter(inscricao =>
        !alunosInscritosAnoAtual.some(aluno => aluno.codigo === inscricao.codigo)
    );

    const alunosCompletos = alunosAtivos.map(aluno => {
        const inscricao = alunosNaoInscritosAnoAtual.find(
            inscricao => inscricao.aluno.codigo === aluno.codigo);
        return { aluno: aluno, inscricao: inscricao ? inscricao : null };
    });

    console.log(alunosCompletos);

    const handleMotivoChange = (e) => {
        const value = e.target.value;
        setMotivoInativo(value);
        if (value !== 'Outro') {
            setOutroMotivo('');
        }
    };

    const handleOutroMotivoChange = (e) => {
        setOutroMotivo(e.target.value);
    };

    const navigate = useNavigate();
    function handleInscreverAluno(aluno) {
        navigate('/inscricao-aluno', { state: { alunoSelecionadoRelatorio: aluno } });
    }

    function desabilitarAluno() {
        const alunoModificado = { ...mostrarModal };
        alunoModificado.status = 'I';
        if (motivoInativo === 'Outro')
            alunoModificado.motivoInativo = outroMotivo;
        else
            alunoModificado.motivoInativo = motivoInativo;
        dispatch(atualizarAluno(alunoModificado)).then((retorno) => {
            if (retorno.payload.status) {
                toast.success('Aluno desabilitado com sucesso!', {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                    transition: Bounce,
                });
                setMotivoInativo('');
                setOutroMotivo('');
                dispatch(buscarAlunos());
            } else {
                toast.error('Aluno não desabilitado! ' + retorno.payload.mensagem, {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                })
            }
        });
        setMostrarModal(false);
    }

    const exportTableToWord = async () => {
        const table = document.querySelector('.tabela');
        const rows = table.querySelectorAll('tr');

        const docTable = new Table({
            rows: Array.from(rows).map((row, rowIndex) => new TableRow({
                children: Array.from(row.cells).slice(0, -1).map(cell => new TableCell({ // Seleciona todas as células, exceto a última (coluna de ações)
                    children: [new Paragraph({
                        children: [
                            new TextRun({
                                text: cell.textContent,
                                bold: rowIndex === 0,
                            }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: {
                            before: 200,
                            after: 200,
                        },
                    })],
                    width: {
                        size: 100 / (row.cells.length - 1),
                        type: WidthType.PERCENTAGE,
                    },
                    margins: {
                        top: 100,
                        bottom: 100,
                        left: 100,
                        right: 100,
                    },
                })),
            })),
            width: {
                size: 100,
                type: WidthType.PERCENTAGE,
            },
            alignment: AlignmentType.CENTER,
            margins: {
                left: 300,
                right: 300,
            },
        });

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        text: "Relatório de Alunos Desatualizados",
                        heading: HeadingLevel.TITLE,
                        alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({
                        text: `Ordenado por: Aluno`,
                        alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({
                        text: "",
                        spacing: {
                            after: 300,
                        },
                    }),
                    docTable,
                ].filter(Boolean),
            }],
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nomeArquivo + '.docx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <Pagina>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-6%', padding: '2%' }}>
                <Button onClick={() => setModalArquivo(true)}>
                    <MdFileDownload style={{ width: '100%', height: '100%' }} />
                </Button>
            </div>
            <Container style={{ marginTop: '2%' }}>
                <ToastContainer />
                <div className="mb-5 d-flex justify-content-center align-items-center">
                    <input
                        type="text"
                        className="form-control"
                        style={{
                            borderRadius: '8px',
                            padding: '12px 16px',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                            border: '1px solid #ced4da',
                            transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
                            width: '750px',
                        }}
                        placeholder="Buscar alunos..."
                        value={termoBusca}
                        onChange={e => setTermoBusca(e.target.value)}
                    />
                </div>
                {alunosCompletos.length > 0 && <table className='tabela'>
                    <thead className='head-tabela'>
                        <tr>
                            <th className='linhas-titulo-tabela'>Ano Inscrição</th>
                            <th className='linhas-titulo-tabela'>Aluno</th>
                            <th className='linhas-titulo-tabela'>Escola</th>
                            <th className='linhas-titulo-tabela'>Rota</th>
                            <th className='linhas-titulo-tabela'>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {alunosCompletos.map(aluno => (
                            <tr key={aluno.aluno.codigo}>
                                <td className='linhas-tabela'>{aluno.inscricao?.ano || 'Aluno não possui inscrição.'}</td>
                                <td className="linhas-tabela">
                                    <OverlayTrigger
                                    trigger="hover"
                                    key="bottom"
                                    placement="bottom"
                                    overlay={
                                        <Popover id="popover-positioned-bottom">
                                            <Popover.Header as="h3"></Popover.Header>
                                            <Popover.Body>
                                                <p>RG: {aluno.aluno.rg}</p>
                                                <p>Data de Nascimento: {format(new Date(aluno.aluno.dataNasc), 'dd/MM/yyyy')}</p>
                                                <p>Celular: {aluno.aluno.celular}</p>
                                                <p>Observações: {aluno.aluno.observacoes}</p>
                                            </Popover.Body>
                                        </Popover>
                                    }
                                    >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        {aluno.aluno.nome}
                                        <div style={{ width: '15%', marginLeft: '2%', textAlign: 'center' }}>
                                            <IoInformationCircleSharp />
                                        </div>
                                    </div></OverlayTrigger>
                                </td>
                                <td className='linhas-tabela'>{aluno.inscricao?.escola?.nome || 'Aluno não possui inscrição.'}</td>
                                <td className="linhas-tabela">
                                    <OverlayTrigger
                                        trigger="hover"
                                        key="bottom"
                                        placement="bottom"
                                        overlay={
                                            <Popover id="popover-positioned-bottom">
                                                <Popover.Header as="h3"></Popover.Header>
                                                <Popover.Body>
                                                    <p>Motoristas:</p>
                                                    {aluno.inscricao?.rota?.motoristas && aluno.inscricao.rota.motoristas.length > 0 && aluno.inscricao.rota.motoristas.map((motorista) => (
                                                        <p>{motorista.nome}</p>
                                                    ))}
                                                    {aluno.inscricao?.rota?.monitor && (
                                                        <p>Monitor: {aluno.inscricao.rota.monitor.nome}</p>
                                                    )}
                                                    {aluno.inscricao?.rota?.veiculo && (
                                                        <p>Veículo: {aluno.inscricao.rota.veiculo.modelo}, {aluno.inscricao.rota.veiculo.placa}</p>
                                                    )}

                                                </Popover.Body>
                                            </Popover>
                                        }
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            {aluno.inscricao?.rota?.nome || 'Aluno não possui inscrição.'}
                                            <div style={{ width: '15%', marginLeft: '2%', textAlign: 'center' }}>
                                                <IoInformationCircleSharp />
                                            </div>
                                        </div>
                                    </OverlayTrigger>
                                </td>

                                <td className='linhas-tabela' style={{ display: 'flex', alignItems: 'center', gap: '2%', justifyContent: 'center' }}>
                                    <Button style={{ display: 'flex', alignItems: 'center' }} onClick={() => handleInscreverAluno(aluno.aluno)}> <TfiWrite /></Button>
                                    <Button style={{ display: 'flex', alignItems: 'center' }} variant='danger' onClick={() => setMostrarModal(aluno.aluno)}><IoPersonRemove /></Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>}
                {alunosCompletos.length == 0 && <p>Não há alunos desatualizados ou não inscritos.</p>}
                <Modal show={mostrarModal} onHide={() => setMostrarModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Desabilitar Aluno</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group>
                            <Form.Label>Selecione o motivo:</Form.Label>
                            <Form.Control
                                as="select"
                                name="motivoInativo"
                                id="motivoInativo"
                                onChange={handleMotivoChange}
                                value={motivoInativo}
                            >
                                <option>Selecione o motivo</option>
                                <option value="Ensino Médio Completo">Ensino Médio Completo</option>
                                <option value="Mudou-se de Álvares Machado">Mudou-se de Álvares Machado</option>
                                <option value="Deixou de utilizar rede pública">Deixou de utilizar rede pública</option>
                                <option value="Outro">Outro...</option>
                            </Form.Control>
                        </Form.Group>
                        {motivoInativo === 'Outro' && (
                            <Form.Group className="mt-3">
                                <Form.Label>Digite o motivo:</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={outroMotivo}
                                    onChange={handleOutroMotivoChange}
                                />
                            </Form.Group>
                        )}
                    </Modal.Body>
                    <Modal.Footer className="d-flex justify-content-center">
                        <Button variant="danger" disabled={(!motivoInativo || (motivoInativo === 'Outro' && !outroMotivo))} onClick={desabilitarAluno}>Sim</Button>
                        <Button variant="secondary" onClick={() => setMostrarModal(false)}>Cancelar</Button>
                    </Modal.Footer>
                </Modal>
                <Modal show={modalArquivo} onHide={() => setModalArquivo(false)}>
                    <Modal.Header closeButton>
                        <strong>Baixar Arquivo</strong>
                    </Modal.Header>
                    <Modal.Body style={{ gap: '3%' }}>
                        <label for="nomeArquivo">Digite o nome do arquivo desejado:</label>
                        <input type="text" value={nomeArquivo} onChange={(e) => setNomeArquivo(e.target.value)} className="form-control" />
                    </Modal.Body>
                    <Modal.Footer className="justify-content-center">
                        <Button disabled={!nomeArquivo} onClick={() => { exportTableToWord(); setModalArquivo(false); setNomeArquivo(''); }} variant="primary">Baixar</Button>
                        <Button onClick={() => setModalArquivo(false)} variant="secondary">Cancelar</Button>
                    </Modal.Footer>
                </Modal>
            </Container>
        </Pagina>
    );
}
