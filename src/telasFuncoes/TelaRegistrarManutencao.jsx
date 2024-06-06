import { Container, Row } from "react-bootstrap";
import Pagina from "../templates/Pagina";
import TelaMensagem from "../telasCadastro/TelaMensagem";
import { useState } from "react";
import TabelaManutencao from "./tabelas/TabelaManutencao"
import CadastroManutencao from "./formularios/CadManutencao.jsx";

export default function TelaRegistrarManutencao(props) {
    const [exibirFormulario, setExibirFormulario] = useState(false);
    const [mostrarMensagem, setMostrarMensagem] = useState(false);
    const [mensagem, setMensagem] = useState("");
    const [tipoMensagem, setTipoMensagem] = useState("");
    const [manutencaoParaEdicao, setManutencaoParaEdicao] = useState({
        placa: '',
        tipo: '',
        data: '',
        observacoes: ''
    });
    const [modoEdicao, setModoEdicao] = useState(false);

    if (mostrarMensagem) {
        return (
            <TelaMensagem mensagem={mensagem} tipo={tipoMensagem} setMostrarMensagem={setMostrarMensagem} />
        );
    } else {
        return (
            <Pagina>
                <Container className="mt-4">
                    <Row className="justify-content-center">
                        {
                            exibirFormulario ?
                                <CadastroManutencao
                                    exibirFormulario={setExibirFormulario}
                                    manutencaoParaEdicao={manutencaoParaEdicao}
                                    setManutencaoParaEdicao={setManutencaoParaEdicao}
                                    modoEdicao={modoEdicao}
                                    setModoEdicao={setModoEdicao}
                                    setMostrarMensagem={setMostrarMensagem}
                                    setMensagem={setMensagem}
                                    setTipoMensagem={setTipoMensagem}
                                />
                                :
                                <TabelaManutencao
                                    exibirFormulario={setExibirFormulario}
                                    setManutencaoParaEdicao={setManutencaoParaEdicao}
                                    setModoEdicao={setModoEdicao}
                                />
                        }
                    </Row>
                </Container>
            </Pagina>
        );
    }
}